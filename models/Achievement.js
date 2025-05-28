const mongoose = require("mongoose");

const AchievementSchema = mongoose.Schema(
  {
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "achievementtype",
    },
    member_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "member",
    },
    tree_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "treeInfo",
    },
    date: {
      type: String,
      default: Date.now,
      set: (val) => {
        return new Date(val).toISOString().split("T")[0];
      },
    },
  },
  { timestamps: true }
);

const AchievementModel = mongoose.model(
  "achievement",
  AchievementSchema,
  "achievements"
);
module.exports = AchievementModel;
