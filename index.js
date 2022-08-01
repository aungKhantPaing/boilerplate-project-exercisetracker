const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const { ObjectId } = require("mongoose").Types;
require("dotenv").config();
const db = require("./db");
const userModel = require("./userModel");

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", async (req, res) => {
  const users = await userModel.aggregate([
    {
      $project: {
        username: 1,
        __v: 1,
      },
    },
  ]);
  res.json(users);
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const user = await userModel
    .findById(new ObjectId(req.params._id))
    .then((e) => e.toJSON());
  if (user) {
    const { from, to, limit } = req.query;
    const fromUnix = from ? new Date(from).getTime() : 0;
    const toUnix = to ? new Date(to).getTime() : Number.MAX_SAFE_INTEGER;
    let log = (user.exercises || [])
      .filter((e) => {
        const unix = new Date(e.date).getTime();
        return fromUnix <= unix && unix <= toUnix;
      })
      .map((e) => {
        delete e._id;
        return e;
      });
    if (Number.isInteger(Number.parseInt(limit))) {
      log = log.slice(0, limit);
    }
    res.json({
      _id: user._id,
      count: log.length,
      username: user.username,
      log,
    });
  }
});

app.get("/api/users/:_id/exercises", async (req, res, next) => {
  const user = await userModel
    .findOne({ _id: ObjectId(req.params._id) })
    .catch(next);

  if (user) {
    res.json({
      ...user.toJSON(),
    });
  }
});

app.post("/api/users", async (req, res) => {
  const newUser = await userModel.create({
    username: req.body.username,
  });
  res.json({
    _id: newUser._id,
    username: newUser.username,
  });
});

app.post("/api/users/:_id/exercises", async (req, res, next) => {
  const exercise = {
    description: req.body.description,
    duration: Number.parseFloat(req.body.duration),
    date: new Date(req.body.date || Date.now()),
  };
  const updatedUser = await userModel
    .findOneAndUpdate(
      { _id: ObjectId(req.params._id) },
      { $push: { exercises: exercise } },
      { projection: "username" }
    )
    .catch(next);
  if (updatedUser) {
    res.json({
      ...updatedUser.toJSON(),
      ...exercise,
      date: new Date(exercise.date).toDateString(),
    });
  }
});

(async () => {
  await db.connect(process.env.DB_URL);
  const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
  });
})();
