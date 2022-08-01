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
        username: "$name",
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
    const fromUnix = new Date(from).getTime();
    const toUnix = to ? new Date(to).getTime() : Number.MAX_SAFE_INTEGER;
    let logs = (user.exercises || []).filter((e) => {
      const unix = new Date(e.date).getTime();
      return fromUnix <= unix && unix <= toUnix;
    });
    if (Number.isInteger(Number.parseInt(limit))) {
      logs = logs.slice(0, limit);
    }
    res.json({
      _id: user._id,
      username: user.name,
      logs,
    });
  }
});

app.post("/api/users", async (req, res) => {
  const newUser = await userModel.create({
    name: req.body.username,
  });
  res.json({
    _id: newUser._id,
    username: newUser.name,
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
      { projection: "name" }
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
