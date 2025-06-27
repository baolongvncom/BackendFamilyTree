const mongoose = require("mongoose");

const DeathCauseSchema = mongoose.Schema({
  name: {
    type: String,
  },
  tree_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "treeinfo",
  },
});

const DeathCauseModel = mongoose.model(
  "deathcause",
  DeathCauseSchema,
  "deathcauses"
);
module.exports = DeathCauseModel;
