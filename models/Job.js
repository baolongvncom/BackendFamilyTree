const mongoose = require("mongoose");

const JobSchema = mongoose.Schema({
  name: {
    type: String,
  },
  tree_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "treeinfo",
  },
});

const JobModel = mongoose.model("job", JobSchema, "jobs");
module.exports = JobModel;
