const mongoose = require("mongoose");

const JobSchema = mongoose.Schema(
  {
    name: {
      type: String,
    },
  },
);

const JobModel = mongoose.model(
  "job",
  JobSchema,
  "jobs"
);
module.exports = JobModel;