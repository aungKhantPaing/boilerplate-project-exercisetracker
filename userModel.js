let mongoose = require("mongoose");

let UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  exercises: [
    {
      description: {
        type: String,
        required: true,
      },
      duration: {
        type: Number,
        required: false,
      },
      date: {
        type: Date,
        transform: (v) => v.toDateString(),
        default: () => new Date(),
      },
    },
  ],
});

UserSchema.index({ short_url: 1 });

module.exports = mongoose.model("user", UserSchema);
