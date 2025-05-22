const mongoose = require("mongoose");

const PermissionSchema = mongoose.Schema(
  {
    name: {
      type: String,
    },
  },
);

const PermissionModel = mongoose.model(
  "permission",
  PermissionSchema,
  "permissions"
);
module.exports = PermissionModel;