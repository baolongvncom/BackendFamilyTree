const mongoose = require("mongoose");

const HometownSchema = mongoose.Schema({
  name: {
    type: String,
  },
  tree_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "treeinfo",
  },
});

const HometownModel = mongoose.model("hometown", HometownSchema, "hometowns");
module.exports = HometownModel;
