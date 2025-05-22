const mongoose = require("mongoose");

const DeathSchema = mongoose.Schema(
  {
    deathcause_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "deathcause",
    },
    gravesite_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "gravesite",
    },
    member_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "member",
    },
    date_of_death: {
      type: String,
      default: Date.now,
      set: (val) => {
        return new Date(val).toISOString().split("T")[0];
      },
    },
    time_of_death: {
      type: String,
      default: "00:00",
    },
    tree_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "treeInfo",
    },
  },
  { timestamps: true }
);

const DeathModel = mongoose.model("death", DeathSchema, "deaths");
module.exports = DeathModel;
