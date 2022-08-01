const mongoose = require("mongoose");

module.exports = {
  async connect(uri) {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  },
};
