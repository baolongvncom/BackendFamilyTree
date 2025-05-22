const mongoose = require("mongoose");

// Sechema for Creating Member
const MemberSchema = mongoose.Schema(
  {
    tree_id: {
      type: String,
      required: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    alive: {
      type: Boolean,
      default: true,
    },
    death_id: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "male",
    },
    married: {
      type: Boolean,
      default: false,
    },
    being_child: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      default: "",
      required: false,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    date_of_birth: {
      type: String,
      default: Date.now,
      set: (val) => {
        return new Date(val).toISOString().split("T")[0];
      },
    },
    place_of_birth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "hometown",
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "job",
    },
    address: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    couples_relationship: {
      type: String,
      default: "",
    },
    parents_relationship: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const MemberModel = mongoose.model("member", MemberSchema, "members");
module.exports = MemberModel;
