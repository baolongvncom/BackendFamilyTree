const mongoose = require("mongoose");

const RelationshipSchema = new mongoose.Schema(
  {
    tree_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "TreeInfo",
    },
    type: {
      type: String,
      required: true,
      enum: ["couples", "parents"],
    },
    data: {
      husband: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true,
      },
      wife: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
        required: true,
      },
      children: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Member",
        },
      ],
    },
  },
  { timestamps: true }
);

const RelationshipModel = mongoose.model(
  "relationship",
  RelationshipSchema,
  "relationships"
);
module.exports = RelationshipModel;
