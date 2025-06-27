const mongoose = require("mongoose");

const AchievementTypeSchema = mongoose.Schema({
  name: {
    type: String,
  },
  tree_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "treeinfo",
  },
});

const AchievementTypeModel = mongoose.model(
  "achievementtype",
  AchievementTypeSchema,
  "achievementtypes"
);
module.exports = AchievementTypeModel;
