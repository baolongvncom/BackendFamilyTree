const mongoose = require("mongoose");

const HometownSchema = mongoose.Schema(
  {
    name: {
      type: String,
    },
  },
);

const HometownModel = mongoose.model(
  "hometown",
  HometownSchema,
  "hometowns"
);
module.exports = HometownModel;