const mongoose = require("mongoose");

const DeathCauseSchema = mongoose.Schema(
  {
    name: {
      type: String,
    },
  },
);

const DeathCauseModel = mongoose.model(
  "deathcause",
  DeathCauseSchema,
  "deathcauses"
);
module.exports = DeathCauseModel;