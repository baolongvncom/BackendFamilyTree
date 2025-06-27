const mongoose = require("mongoose");

const GraveSiteSchema = mongoose.Schema({
  name: {
    type: String,
  },
  tree_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "treeinfo",
  },
});

const GraveSiteModel = mongoose.model(
  "gravesite",
  GraveSiteSchema,
  "gravesites"
);
module.exports = GraveSiteModel;
