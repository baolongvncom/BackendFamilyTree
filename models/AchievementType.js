const mongoose = require("mongoose");

const AchievementTypeSchema = mongoose.Schema(
  {
    name: {
      type: String,
    },
  },
);

const AchievementTypeModel = mongoose.model(
  "achievementtype",
  AchievementTypeSchema,
  "achievementtypes"
);
module.exports = AchievementTypeModel;
