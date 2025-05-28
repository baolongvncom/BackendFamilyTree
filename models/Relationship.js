const mongoose = require("mongoose");

const RelationshipSchema = new mongoose.Schema(
  {
    tree_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "treeInfo",
    },
    type: {
      type: String,
      required: true,
      enum: ["couples", "parents"],
    },
    data: {
      husband: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "member",
        required: true,
      },
      wife: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "member",
        required: true,
      },
      date_of_marriage: {
        type: String,
        default: null,
      },
      children: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "member",
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
