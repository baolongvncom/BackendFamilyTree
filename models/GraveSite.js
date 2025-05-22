const mongoose = require("mongoose");

const GraveSiteSchema = mongoose.Schema(
  {
    name: {
      type: String,
    },
  },
);

const GraveSiteModel = mongoose.model(
  "gravesite",
  GraveSiteSchema,
  "gravesites"
);
module.exports = GraveSiteModel;