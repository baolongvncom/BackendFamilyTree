const port = 4000;
const http = require("http");
const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const imgur = require("imgur");

const server = http.createServer(app);
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const uuid = require("uuid");
const { ObjectId } = require("mongodb");

const User = require("./models/User");

const TreeInfo = require("./models/TreeInfo");

const Member = require("./models/Member");

const Relationship = require("./models/Relationship");

const Achievement = require("./models/Achievement");
const AchievementType = require("./models/AchievementType");

const Death = require("./models/Death");
const GraveSite = require("./models/GraveSite");
const DeathCause = require("./models/DeathCause");
const Job = require("./models/Job");
const Hometown = require("./models/Hometown");
const Permission = require("./models/Permission");
const { count } = require("console");
require("dotenv/config");

const secretKey = process.env.SECRET_KEY;

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

app.use(express.json());
app.use(
  cors({
    origin: process.env.FAMILYTREE_URL, 
    credentials: true,
  })
);

// UID Generation
function generateID() {
  return uuid.v4();
}

// Database connection with MongoDB

// MongoDB_URL = "mongodb://localhost:27017/FamilyTree";
MongoDB_URL = process.env.MongoDB_URL;
mongoose.connect(MongoDB_URL);

// API Creation
app.get("/", (req, res) => {
  res.send("Hello from the server");
});

// Image Storage Engine
const storage = multer.diskStorage({
  destination: "./upload/images/",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
});

// Creating Upload Endpoint for images
app.use("/images", express.static("upload/images"));

const fetchAdmin = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    res.send({
      isAdmin: false,
      message: "Please authenticate using a valid token",
    });
  } else
    try {
      const data = jwt.verify(token, "admin");
      req.user = data.user;
      next();
    } catch (error) {
      res.send({
        isAdmin: false,
        message: "Please authenticate using a valid token",
      });
    }
};

const fetchUser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    res.send({
      success: false,
      message: "Please authenticate using a valid token",
    });
  } else
    try {
      const data = jwt.verify(token, secretKey);
      req.user = data.user;
      next();
    } catch (error) {
      res.send({
        success: false,
        message: "Please authenticate using a valid token",
      });
    }
};

const fetchEditTreeId = async (req, res, next) => {
  const tree_id = req.body.tree_id;
  if (!tree_id) {
    res.send({
      success: false,
      message: "Please send a valid Tree Id",
    });
  } else
    try {
      let tree = await TreeInfo.findOne({ _id: tree_id });

      if (!tree) {
        return res
          .status(404)
          .json({ success: false, message: "Tree not found" });
      }

      const userRoleId = tree.role[req.user.email];

      if (userRoleId) {
        const userRole = await Permission.findById(userRoleId);
        if (!userRole) throw new Error("Permission not Found");
        if (userRole.name === "owner" || userRole.name === "editor") {
          return next();
        }
      }

      res.status(403).json({
        success: false,
        message: "You do not have permission to edit this tree",
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Please send a valid Tree Id",
      });
    }
};

const fetchViewTreeId = async (req, res, next) => {
  const tree_id = req.body.tree_id;
  if (!tree_id) {
    res.send({
      success: false,
      message: "Please send a valid Tree Id",
    });
  } else
    try {
      let tree = await TreeInfo.findOne({ _id: tree_id });

      if (!tree) {
        return res
          .status(404)
          .json({ success: false, message: "Tree not found" });
      }

      const userRoleId = tree.role?.[req.user.email];

      if (userRoleId) {
        const userRole = await Permission.findById(userRoleId);
        if (!userRole) throw new Error("Permission not Found");
        if (
          userRole.name === "owner" ||
          userRole.name === "editor" ||
          userRole.name === "viewer"
        ) {
          return next();
        }
      }

      res.status(403).json({
        success: false,
        message: "You do not have permission to view this tree",
      });
    } catch (error) {
      res.send({
        success: false,
        message: "Please send a valid Tree Id",
      });
    }
};

const fetchOwnerEditPermissionTreeId = async (req, res, next) => {
  const tree_id = req.body.tree_id;
  if (!tree_id) {
    res.send({
      success: false,
      message: "Please send a valid Tree Id",
    });
  } else
    try {
      let tree = await TreeInfo.findOne({ _id: tree_id });

      if (!tree) {
        return res
          .status(404)
          .json({ success: false, message: "Tree not found" });
      }

      const userRoleId = tree.role?.[req.user.email];

      if (userRoleId) {
        const userRole = await Permission.findById(userRoleId);
        if (!userRole) throw new Error("Permission not Found");
        if (userRole.name === "owner") {
          return next();
        }
      }

      res.status(403).json({
        success: false,
        message: "You do not have permission to edit permission of this tree",
      });
    } catch (error) {
      res.send({
        success: false,
        message: "Please send a valid Tree Id",
      });
    }
};

const fetchViewMember = async (req, res, next) => {
  const member_id = req.body.member_id;
  if (!member_id) {
    res.send({
      success: false,
      message: "Please send a valid Member Id 123",
    });
  } else
    try {
      let member = await Member.findOne({ _id: member_id });
      if (!member) {
        return res
          .status(404)
          .json({ success: false, message: "Member not found" });
      }

      const tree_id = member.tree_id;
      let tree = await TreeInfo.findOne({ _id: tree_id });

      if (!tree) {
        return res
          .status(404)
          .json({ success: false, message: "Tree of Member Info Error" });
      }

      const userRoleId = tree.role?.[req.user.email];

      if (userRoleId) {
        const userRole = await Permission.findById(userRoleId);
        if (!userRole) throw new Error("Permission not Found");
        if (
          userRole.name === "owner" ||
          userRole.name === "editor" ||
          userRole.name === "viewer"
        ) {
          return next();
        }
      }

      res.status(403).json({
        success: false,
        message: "You do not have permission to view this member",
      });
    } catch (error) {
      res.send({
        success: false,
        message: "Please send a valid Member Id",
      });
    }
};

const fetchEditMember = async (req, res, next) => {
  const member_id = req.body.member_id;
  if (!member_id) {
    res.send({
      success: false,
      message: "Please send a valid Member Id 123",
    });
  } else
    try {
      let member = await Member.findOne({ _id: member_id });
      if (!member) {
        return res
          .status(404)
          .json({ success: false, message: "Member not found" });
      }

      const tree_id = member.tree_id;
      let tree = await TreeInfo.findOne({ _id: tree_id });

      if (!tree) {
        return res
          .status(404)
          .json({ success: false, message: "Tree of Member Info Error" });
      }

      const userRoleId = tree.role?.[req.user.email];

      if (userRoleId) {
        const userRole = await Permission.findById(userRoleId);
        if (!userRole) throw new Error("Permission not Found");
        if (userRole.name === "owner" || userRole.name === "editor") {
          return next();
        }
      }

      res.status(403).json({
        success: false,
        message: "You do not have permission to edit this member",
      });
    } catch (error) {
      res.send({
        success: false,
        message: "Please send a valid Member Id",
      });
    }
};

// Creating Endpoint for registering a user
app.post("/api/signup", async (req, res) => {
  let check = await User.findOne({ email: req.body.email });

  const password = req.body.password;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  if (check) {
    return res.status(400).json({
      success: false,
      message: "Email already exists",
    });
  }
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  });

  await user.save();

  const data = {
    user: {
      _id: user._id,
      username: req.body.username,
      email: req.body.email,
    },
  };

  const token = jwt.sign(data, secretKey);
  res.json({
    success: true,
    token: token,
  });
});

app.post("/api/change-password", async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    // Dùng bcrypt để so sánh password
    const passCompare = await bcrypt.compare(
      req.body.old_password,
      user.password
    );
    if (passCompare) {
      const salt = await bcrypt.genSalt(10);
      const newHashedPassword = await bcrypt.hash(req.body.new_password, salt);
      user.password = newHashedPassword;
      await user.save();
      res.json({
        success: true,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Invalid Old Password",
      });
    }
  } else {
    res.status(500).json({
      success: false,
      message: "User not found",
    });
  }
});

// Admin signup
app.get("/api/adminsignup", async (req, res) => {
  let check = await User.findOne({ email: "admin" });
  if (check) {
    res.status(500).json({ success: false, message: "Admin already exists" });
    return;
  }

  const password = "admin";
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  cart["0"] = 0;
  order.push("0");
  const user = new User({
    username: "admin",
    email: "admin",
    password: hashedPassword,
  });

  await user.save();

  const data = {
    user: {
      _id: user._id,
      username: "admin",
      email: "admin",
    },
  };

  const token = jwt.sign(data, "admin");
  isAdminExist = true;
  res.json({
    success: true,
    token: token,
  });
});

// Creating endpoint for user/admin login
app.post("/api/signin", async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    // Dùng bcrypt để so sánh password
    const passCompare = await bcrypt.compare(req.body.password, user.password);
    if (passCompare) {
      const data = {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
        },
      };
      const token =
        req.body.email === "admin"
          ? jwt.sign(data, "admin")
          : jwt.sign(data, secretKey);
      req.body.email === "admin"
        ? res.json({
            success: true,
            token: token,
            username: user.username,
            admin: true,
          })
        : res.json({
            success: true,
            token: token,
            username: user.username,
            admin: false,
          });
    } else {
      res.status(500).json({
        success: false,
        message: "Invalid Password",
      });
    }
  } else {
    res.status(500).json({
      success: false,
      message: "User not found",
    });
  }
});

app.get("/api/isadmin", fetchAdmin, async (req, res) => {
  res.json({ success: true });
});

app.get("/api/isuser", fetchUser, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user)
    res.status(500).json({
      success: 0,
      message: "Invalid User!",
    });
  res.json({
    success: true,
    email: user.email,
    username: user.username,
  });
});

app.post("/api/updateusername", fetchUser, async (req, res) => {
  try {
    if (!req.body.username) throw new Error("New Username is Invalid!");
    const user = await User.findOne({ email: req.user.email });
    if (!user) throw new Error("User not found!");
    user.username = req.body.username;
    await user.save();
    res.json({
      success: true,
      email: user.email,
      username: user.username,
    });
  } catch (err) {
    res.status(500).json({
      success: 0,
      message: err.message,
    });
  }
});

// app.post("/api/upload", upload.single("treeInfo"), (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: 0,
//         message: "No file uploaded",
//       });
//     }

//     const imageUrl = `${req.protocol}://${req.get("host")}/images/${
//       req.file.filename
//     }`;

//     res.json({
//       success: 1,
//       image_url: imageUrl,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: 0,
//       message: err.message,
//     });
//   }
// });

app.post("/api/upload", upload.single("treeInfo"), (req, res) => {
  cloudinary.uploader
    .upload(`./upload/images/${req.file.filename}`)
    .then((json) => {
      res.json({
        success: 1,
        image_url: json.secure_url,
      });
    })
    .catch((err) => {
      console.error(err.message);
      res.json({
        success: 0,
        message: err.message,
      });
    });
});

// Add TreeInfo API

async function generateUniqueCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;
  let exists = true;

  while (exists) {
    code = "#";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Kiểm tra xem mã đã tồn tại trong database chưa
    exists = await TreeInfo.exists({ code: code });
  }

  return code;
}

app.get("/api/treeinfo/getJobAndHometown", fetchUser, async (req, res) => {
  try {
    const jobs = await Job.find();
    const hometowns = await Hometown.find();
    res.json({
      success: true,
      jobs,
      hometowns,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

app.post("/api/treeinfo/add", fetchUser, async (req, res) => {
  const new_code = await generateUniqueCode();
  const owner_permission = await Permission.findOne({ name: "owner" });
  const role = {
    [req.user.email]: owner_permission._id,
  };
  const treeInfo = new TreeInfo({
    name: req.body.name,
    code: new_code,
    image: req.body.image,
    description: req.body.description,
    role,
  });
  await treeInfo.save();
  console.log("New Tree Saved", treeInfo);
  res.json({
    success: true,
  });
});

app.post(
  "/api/treeinfo/delete",
  fetchUser,
  fetchOwnerEditPermissionTreeId,
  async (req, res) => {
    try {
      const { tree_id } = req.body;

      if (!tree_id) {
        return res
          .status(400)
          .json({ success: 0, message: "Tree ID is required" });
      }

      const treeInfo = await TreeInfo.findOne({ _id: tree_id });
      if (!treeInfo) {
        return res
          .status(404)
          .json({ success: 0, message: "TreeInfo not found" });
      }

      await Member.deleteMany({ tree_id: tree_id });
      await Relationship.deleteMany({ tree_id: tree_id });
      await TreeInfo.deleteOne({ _id: tree_id });
      await Achievement.deleteMany({ tree_id: tree_id });
      await Death.deleteMany({ tree_id: tree_id });

      res.status(200).json({
        success: 1,
        message: "TreeInfo and related data deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting TreeInfo:", error.message);
      res.status(500).json({ success: 0, message: error.message });
    }
  }
);

app.get("/api/treeinfo/get", fetchUser, async (req, res) => {
  try {
    const treeInfos = await TreeInfo.find();

    const filteredTreeInfos = await Promise.all(
      treeInfos
        .filter(
          (info) => info.role && Object.keys(info.role).includes(req.user.email)
        )
        .map(async (info) => {
          const roleId = info.role[req.user.email];
          const permission = await Permission.findById(roleId);

          return {
            ...info.toObject(),
            role: roleId,
            role_name: permission ? permission.name : null,
          };
        })
    );

    res.json({ success: 1, treeInfos: filteredTreeInfos });
  } catch (error) {
    console.error("Error fetching TreeInfos:", error.message);
    res.status(500).json({ success: 0, message: error.message });
  }
});

app.post("/api/treeinfo/find", fetchUser, async (req, res) => {
  try {
    const treeInfo = await TreeInfo.findOne({ code: req.body.code });

    if (!treeInfo) {
      return res.status(404).json({ success: 0, message: "Tree not found" });
    }

    const treeObj = treeInfo.toObject();

    if (treeInfo.role && treeInfo.role[req.user.email]) {
      const role = await Permission.findById(treeInfo.role[req.user.email]);
      treeObj.role_name = role ? role.name : null;
    } else {
      treeObj.role_name = null;
    }

    res.json({ success: 1, treeInfo: treeObj });
  } catch (error) {
    console.error("Error Searching TreeInfo:", error.message);
    res.status(500).json({ success: 0, message: error.message });
  }
});

app.post("/api/treeinfo/asktoview", fetchUser, async (req, res) => {
  try {
    const treeInfo = await TreeInfo.findOne({ _id: req.body.tree_id });
    if (!treeInfo) {
      return res
        .status(404)
        .json({ success: 0, message: "TreeInfo not found" });
    }

    if (!treeInfo.role[req.user.email]) {
      const pending_permission = await Permission.findOne({ name: "pending" });
      if (!pending_permission) throw new Error("Pending Permission not Found");
      treeInfo.role[req.user.email] = pending_permission._id;
      treeInfo.markModified("role");
      await treeInfo.save();
    }

    res.json({ success: 1 });
  } catch (error) {
    console.error("Error Ask to View:", error.message);
    res.status(500).json({ success: 0, message: error.message });
  }
});

app.post(
  "/api/treeinfo/updatepermission",
  fetchUser,
  fetchOwnerEditPermissionTreeId,
  async (req, res) => {
    try {
      const treeInfo = await TreeInfo.findOne({ _id: req.body.tree_id });
      if (!treeInfo) {
        return res
          .status(404)
          .json({ success: 0, message: "TreeInfo not found" });
      }

      const new_permission = await Permission.findById(req.body.new_permission);

      if (!new_permission) throw new Error("New Permission not Found");

      if (new_permission.name == "owner") {
        if (treeInfo.role[req.body.user_email]) {
          treeInfo.role[req.body.user_email] = new_permission._id;
        } else throw new Error("User Email not found in Roles List!");

        if (treeInfo.role[req.user.email]) {
          const editor_permission = await Permission.findOne({
            name: "editor",
          });
          if (!editor_permission)
            throw new Error("Editor Permission not Found");
          treeInfo.role[req.user.email] = editor_permission._id;
          treeInfo.markModified("role");
          await treeInfo.save();
        } else throw new Error("User Email not found in Roles List!");
      } else {
        if (treeInfo.role[req.body.user_email]) {
          treeInfo.role[req.body.user_email] = new_permission._id;
          treeInfo.markModified("role");
          await treeInfo.save();
        } else throw new Error("User Email not found in Roles List!");
      }

      res.json({ success: 1 });
    } catch (error) {
      console.error("Error updating TreeInfo:", error.message);
      res.status(500).json({ success: 0, message: error.message });
    }
  }
);

app.post(
  "/api/treeinfo/deletepermission",
  fetchUser,
  fetchOwnerEditPermissionTreeId,
  async (req, res) => {
    try {
      const treeInfo = await TreeInfo.findOne({ _id: req.body.tree_id });
      if (!treeInfo) {
        return res
          .status(404)
          .json({ success: 0, message: "TreeInfo not found" });
      }

      if (!treeInfo.role[req.body.user_email])
        throw new Error("User Permission do not exist!");

      const user_permission = await Permission.findById(
        treeInfo.role[req.body.user_email]
      );

      if (!user_permission) throw new Error("User Permission not Found!");

      if (user_permission.name == "owner") {
        throw new Error("Cannot delete Role Owner!");
      } else {
        if (treeInfo.role[req.body.user_email]) {
          delete treeInfo.role[req.body.user_email];
          treeInfo.markModified("role");
          await treeInfo.save();
        } else throw new Error("User Email not found in Roles List!");
      }

      res.json({ success: 1 });
    } catch (error) {
      console.error("Error Deleting Role TreeInfo:", error.message);
      res.status(500).json({ success: 0, message: error.message });
    }
  }
);

app.post(
  "/api/treeinfo/getpermissions",
  fetchUser,
  fetchOwnerEditPermissionTreeId,
  async (req, res) => {
    try {
      const treeInfo = await TreeInfo.findOne({ _id: req.body.tree_id });
      if (!treeInfo) {
        return res
          .status(404)
          .json({ success: 0, message: "TreeInfo not found" });
      }

      const emails = Object.keys(treeInfo.role);
      const users = await User.find({ email: { $in: emails } });

      const permissions = await Promise.all(
        users.map(async (user) => {
          const roleId = treeInfo.role[user.email];
          const roleDoc = await Permission.findById(roleId);

          return {
            email: user.email,
            username: user.username,
            role: roleId,
            role_name: roleDoc.name,
          };
        })
      );

      const permissionData = await Permission.find();

      res.json({ success: 1, permissions, permissionData });
    } catch (error) {
      console.error("Error fetching TreeInfo permissions:", error.message);
      res.status(500).json({ success: 0, message: error.message });
    }
  }
);

app.post("/api/family/get", fetchUser, fetchViewTreeId, async (req, res) => {
  try {
    const family = await Member.find({ tree_id: req.body.tree_id });
    const tree = await TreeInfo.findOne({ _id: req.body.tree_id });

    const permissionId = tree.role[req.user.email];

    const permission = await Permission.findById(permissionId);

    const family_name = tree.name;
    const code = tree.code;
    const description = tree.description;
    const image = tree.image;

    res.json({
      success: true,
      family,
      permission: permission.name,
      family_name,
      code,
      description,
      image,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Internal Server Error ${error}`,
    });
  }
});

app.post("/api/family/update", fetchUser, fetchEditTreeId, async (req, res) => {
  try {
    const treeInfo = await TreeInfo.findById(req.body.tree_id);
    if (!treeInfo) throw new Error("Tree not Found!");
    if (!req.body.treeInfo.name)
      throw new Error("Tree Name must not be Null or Undefined!");
    treeInfo.image = req.body.treeInfo.image;
    treeInfo.name = req.body.treeInfo.name;
    treeInfo.description = req.body.treeInfo.description;
    await treeInfo.save();
    res.json({
      success: true,
      family_name: treeInfo.name,
      description: treeInfo.description,
      image: treeInfo.image,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Internal Server Error ${error}`,
    });
  }
});

app.post("/api/family/add", fetchUser, fetchEditTreeId, async (req, res) => {
  try {
    const hometown = await Hometown.findById(req.body.place_of_birth);
    if (!hometown) throw new Error("Hometown not Found");
    const job = await Job.findById(req.body.job);
    if (!job) throw new Error("Job not Found");

    const member = new Member({
      tree_id: req.body.tree_id,
      full_name: req.body.full_name,
      date_of_birth: new Date(req.body.date_of_birth),
      place_of_birth: req.body.place_of_birth,
      gender: req.body.gender,
      job: req.body.job,
      address: req.body.address,
      image: req.body.image,
      description: req.body.description,
    });
    await member.save();
    console.log("New Member Saved", member);
    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

app.post("/api/member/get", fetchUser, fetchViewMember, async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.body.member_id });
    const tree = await TreeInfo.findOne({ _id: member.tree_id });

    const permissionId = tree.role[req.user.email];

    const permission = await Permission.findById(permissionId);

    const jobs = await Job.find();
    const hometowns = await Hometown.find();

    res.json({
      success: true,
      member,
      jobs,
      hometowns,
      permission: permission.name,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error,
    });
  }
});

app.post("/api/member/delete", fetchUser, fetchEditMember, async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.body.member_id });
    if (!member) {
      throw new Error("Member not found!");
    }

    // Nếu member có quan hệ vợ/chồng
    if (member.couples_relationship && member.couples_relationship !== "") {
      const couples_relationship = await Relationship.findOne({
        _id: member.couples_relationship,
      });

      if (couples_relationship) {
        let partnerId =
          couples_relationship.data.husband.toString() === member._id.toString()
            ? couples_relationship.data.wife
            : couples_relationship.data.husband;

        const partner = await Member.findById(partnerId);
        if (partner) {
          partner.couples_relationship = "";
          partner.married = false;
          await partner.save();
        }

        const childrenIds = couples_relationship.data.children || [];

        if (childrenIds.length > 0) {
          await Member.updateMany(
            { _id: { $in: childrenIds } },
            {
              $set: {
                being_child: false,
                parents_relationship: "",
              },
            }
          );
        }

        await Relationship.deleteOne({ _id: couples_relationship._id });
      }
    }

    await Relationship.updateMany(
      { "data.children": member._id },
      { $pull: { "data.children": member._id } }
    );

    await Achievement.deleteMany({ member_id: member._id });
    await Death.deleteMany({ member_id: member._id });

    await Member.deleteOne({ _id: member._id });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/member/update", fetchUser, fetchEditMember, async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.body.member_id });
    const job = await Job.findById(req.body.member.job);
    if (!job) throw new Error("Job not Found");
    const hometown = await Hometown.findById(req.body.member.place_of_birth);
    if (!hometown) throw new Error("Hometown not Found");
    if (member.married && member.gender != req.body.member.gender)
      throw new Error("Cannot change gender while being married!");
    else member.gender = req.body.member.gender;

    member.full_name = req.body.member.full_name;
    member.job = req.body.member.job;
    member.address = req.body.member.address;
    member.place_of_birth = req.body.member.place_of_birth;
    member.date_of_birth = new Date(req.body.member.date_of_birth);
    member.description = req.body.member.description;
    if (req.body.member.image) {
      member.image = req.body.member.image;
    }

    await member.save();

    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/member/getunmarried", fetchUser, async (req, res) => {
  try {
    const members = await Member.find({
      married: false,
      tree_id: req.body.tree_id,
    });
    res.json({
      success: true,
      members,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

app.post("/api/member/getcouples", fetchUser, async (req, res) => {
  try {
    const relationships = await Relationship.find({
      tree_id: req.body.tree_id,
    });

    const new_relationships = await Promise.all(
      relationships.map(async (relationship) => {
        if (relationship.type === "couples") {
          const [husband_data, wife_data] = await Promise.all([
            Member.findOne({ _id: relationship.data.husband }),
            Member.findOne({ _id: relationship.data.wife }),
          ]);

          return {
            _id: relationship._id,
            type: "couples",
            data: {
              husband: husband_data,
              wife: wife_data,
              date_of_marriage: relationship.data.date_of_marriage,
            },
          };
        }
        return relationship;
      })
    );

    res.json({
      success: true,
      relationships: new_relationships,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

app.post(
  "/api/member/getunparents",
  fetchUser,
  fetchEditTreeId,
  async (req, res) => {
    try {
      let members = await Member.find({
        being_child: false,
        tree_id: req.body.tree_id,
      });
      const member = await Member.findById(req.body.member_id);
      if (!member) throw new Error("Member not Found");

      if (member.parents_relationship && member.parents_relationship !== "") {
        const relationship = await Relationship.findById(
          member.parents_relationship
        )
          .populate("data.husband")
          .populate("data.wife");

        console.log("relationship", relationship);
        const wifeId = relationship.data.wife?._id?.toString();
        const husbandId = relationship.data.husband?._id?.toString();

        // Lọc ra những người không phải là vợ/chồng trong relationship
        members = members.filter((m) => {
          const mId = m._id.toString();
          return mId !== wifeId && mId !== husbandId;
        });
      }

      res.json({
        success: true,
        members,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

app.post(
  "/api/couples_relationship/get",
  fetchUser,
  fetchViewMember,
  async (req, res) => {
    try {
      const member = await Member.findOne({ _id: req.body.member_id });
      if (member) {
        if (member.couples_relationship) {
          const relationship = await Relationship.findOne({
            _id: member.couples_relationship,
          });
          if (relationship.type === "couples") {
            const [husband_data, wife_data, children_data] = await Promise.all([
              Member.findOne({ _id: relationship.data.husband }),
              Member.findOne({ _id: relationship.data.wife }),
              Member.find({
                _id: { $in: relationship.data.children },
              }),
            ]);
            res.json({
              success: true,
              relationship: {
                type: "couples",
                _id: relationship._id,
                data: {
                  husband: husband_data,
                  wife: wife_data,
                  children: children_data,
                  date_of_marriage: relationship.data.date_of_marriage,
                },
              },
            });
          } else throw new Error("Member Relationship Not Found");
        } else {
          res.json({
            success: true,
            relationship: {
              type: "empty",
              _id: "",
              data: {
                husband: "",
                wife: "",
                children: "",
                date_of_marriage: null,
              },
            },
          });
        }
      } else throw new Error("Member Not Found");
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

app.post(
  "/api/parents_relationship/get",
  fetchUser,
  fetchViewMember,
  async (req, res) => {
    try {
      const member = await Member.findOne({ _id: req.body.member_id });

      if (!member) {
        throw new Error("Relationship Not Found");
      }

      if (member.parents_relationship) {
        const relationship = await Relationship.findOne({
          _id: member.parents_relationship,
        });

        if (relationship) {
          const husband = await Member.findOne({
            _id: relationship.data.husband,
          });
          const wife = await Member.findOne({
            _id: relationship.data.wife,
          });
          return res.json({
            success: true,
            relationship: {
              type: "couples",
              _id: relationship._id,
              data: {
                husband,
                wife,
                date_of_marriage: relationship.data.date_of_marriage,
              },
            },
          });
        }
      }

      return res.json({
        success: true,
        relationship: {
          type: "empty",
          _id: "",
          data: {
            husband: "",
            wife: "",
            date_of_marriage: null,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);
app.post(
  "/api/relationship/addcouples",
  fetchUser,
  fetchEditMember,
  async (req, res) => {
    try {
      const member = await Member.findOne({ _id: req.body.member_id });
      const partner = await Member.findOne({ _id: req.body.partner_id });

      if (member.married == true || partner.married == true)
        throw new Error("At least one person is not single!.");

      if (
        member.couples_relationship != "" ||
        partner.couples_relationship != ""
      )
        throw new Error("At least one person is not single!.");

      if (member.gender === partner.gender)
        throw new Error("Two people must have different genders!");

      const children = await Member.find({
        _id: { $in: req.body.children },
        being_child: false,
      });

      const childrenIds = children.map((child) => child._id);

      const new_couples_relationship = new Relationship({
        tree_id: member.tree_id,
        type: "couples",
        data: {
          husband: member.gender === "male" ? member._id : partner._id,
          wife: member.gender === "female" ? member._id : partner._id,
          children: childrenIds,
          date_of_marriage: req.body.date_of_marriage,
        },
      });
      await new_couples_relationship.save();

      member.married = true;
      member.couples_relationship = new_couples_relationship._id;
      partner.married = true;
      partner.couples_relationship = new_couples_relationship._id;

      await member.save();
      await partner.save();

      if (childrenIds.length) {
        await Member.updateMany(
          { _id: { $in: childrenIds } },
          {
            $set: {
              being_child: true,
              parents_relationship: new_couples_relationship._id,
            },
          }
        );
      }
      res.json({
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

app.post(
  "/api/relationship/addparents",
  fetchUser,
  fetchEditMember,
  async (req, res) => {
    try {
      const relationship = await Relationship.findOne({
        _id: req.body.relationship_id,
      });

      const member = await Member.findOne({ _id: req.body.member_id });

      if (relationship && member) {
        member.parents_relationship = relationship._id;
        member.being_child = true;
        relationship.data.children = [
          ...(relationship.data.children || []),
          member._id,
        ];

        await Promise.all([member.save(), relationship.save()]);
      } else throw new Error("Member or Relationship not found!");

      res.json({
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

app.post(
  "/api/relationship/deletecouples",
  fetchUser,
  fetchEditMember,
  async (req, res) => {
    try {
      const member = await Member.findOne({ _id: req.body.member_id });
      if (member) {
        if (member.couples_relationship) {
          const relationship = await Relationship.findOne({
            _id: member.couples_relationship,
          });

          if (relationship) {
            const husband = await Member.findOne({
              _id: relationship.data.husband,
            });
            const wife = await Member.findOne({ _id: relationship.data.wife });

            husband.married = false;
            husband.couples_relationship = "";

            wife.married = false;
            wife.couples_relationship = "";

            await Promise.all([wife.save(), husband.save()]);

            if (relationship.data.children.length > 0) {
              await Member.updateMany(
                { _id: { $in: relationship.data.children } },
                {
                  $set: {
                    being_child: false,
                    parents_relationship: "",
                  },
                }
              );
            }

            await Relationship.deleteOne({ _id: relationship._id });

            res.json({
              success: true,
            });
          } else throw new Error("Relationship not Found");
        } else
          res.json({
            success: true,
          });
      } else throw new Error("Member not Found");
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

app.post(
  "/api/relationship/deleteparents",
  fetchUser,
  fetchEditMember,
  async (req, res) => {
    try {
      const member = await Member.findOne({ _id: req.body.member_id });
      if (member) {
        if (member.parents_relationship && member.being_child) {
          const relationship = await Relationship.findOne({
            _id: member.parents_relationship,
          });

          if (relationship) {
            await Relationship.updateOne(
              { _id: member.parents_relationship },
              { $pull: { "data.children": member._id } }
            );

            member.being_child = false;
            member.parents_relationship = "";

            await member.save();

            res.json({
              success: true,
            });
          } else throw new Error("Relationship not Found");
        } else
          res.json({
            success: true,
          });
      } else throw new Error("Member not Found");
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

app.post(
  "/api/achievement-type/get",
  fetchUser,
  fetchViewMember,
  async (req, res) => {
    try {
      const achievementTypes = await AchievementType.find();
      res.json({
        success: true,
        achievementTypes,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

app.post(
  "/api/achievement/get",
  fetchUser,
  fetchViewMember,
  async (req, res) => {
    try {
      const member = await Member.findById(req.body.member_id);
      if (!member) throw new Error("Member not found");

      const achievements = await Achievement.find({
        member_id: member._id,
      }).populate("type", "name");
      const achievementTypes = await AchievementType.find();

      const treeInfo = await TreeInfo.findOne({ _id: member.tree_id });
      if (!treeInfo) throw new Error("TreeInfo not found");

      const roleId = treeInfo.role?.[req.user.email];

      const role = await Permission.findById(roleId);

      res.json({
        member_fullname: member.full_name,
        role: role?.name || null,
        achievements,
        achievementTypes,
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

app.post(
  "/api/achievement/add",
  fetchUser,
  fetchEditMember,
  async (req, res) => {
    try {
      const member = await Member.findOne({ _id: req.body.member_id });
      if (member) {
        const achievementType = await AchievementType.findOne({
          _id: req.body.achievementType_id,
        });
        if (achievementType) {
          const new_achievement = new Achievement({
            type: achievementType._id,
            member_id: req.body.member_id,
            tree_id: member.tree_id,
            date: req.body.date,
          });
          await new_achievement.save();
          res.json({
            success: true,
          });
        } else throw new Error("Achievement not Found");
      } else throw new Error("Member not Found");
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

app.post(
  "/api/achievement/delete",
  fetchUser,
  fetchEditMember,
  async (req, res) => {
    try {
      const achievement = await Achievement.findOne({
        _id: req.body.achievement_id,
      });
      if (achievement) {
        await Achievement.deleteOne({
          _id: achievement._id,
        });
        res.json({
          success: true,
        });
      } else throw new Error("Achievement not Found");
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

app.post(
  "/api/achievement/update",
  fetchUser,
  fetchEditMember,
  async (req, res) => {
    try {
      const achievement = await Achievement.findOne({
        _id: req.body.achievement_id,
      });
      if (achievement) {
        const achievementType = await AchievementType.findOne({
          _id: req.body.achievementType_id,
        });
        if (achievementType) {
          if (achievementType._id !== achievement.type) {
            achievement.type = achievementType._id;
            await achievement.save();
          }
          res.json({ success: true });
        } else throw new Error("AchievementType not Found");
      } else throw new Error("Achievement not Found");
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

app.post("/api/death/get", fetchUser, fetchViewMember, async (req, res) => {
  try {
    const member = await Member.findById(req.body.member_id);
    if (!member) throw new Error("Member not found");
    const graveSites = await GraveSite.find();
    const deathCauses = await DeathCause.find();
    const treeInfo = await TreeInfo.findOne({ _id: member.tree_id });
    if (!treeInfo) throw new Error("TreeInfo not found");
    const roleId = treeInfo.role?.[req.user.email];
    const role = await Permission.findById(roleId);
    if (!member.death_id) {
      const death = {
        date_of_death: new Date().toISOString().split("T")[0],
        time_of_death: "00:00",
        deathcause_id: null,
        gravesite_id: null,
      };
      res.json({
        member,
        role: role.name,
        death,
        graveSites,
        deathCauses,
        success: true,
      });
    } else {
      const death = await Death.findOne({ _id: member.death_id });
      res.json({
        member,
        role: role.name,
        death,
        graveSites,
        deathCauses,
        success: true,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/death/add", fetchUser, fetchEditMember, async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.body.member_id });
    if (member) {
      const graveSite = await GraveSite.findOne({
        _id: req.body.gravesite_id,
      });

      if (!graveSite) throw new Error("GraveSite not Found");
      const deathCause = await DeathCause.findOne({
        _id: req.body.deathcause_id,
      });

      if (!deathCause) throw new Error("DeathCause not Found");

      const date_of_birth = new Date(member.date_of_birth);
      const date_of_death = new Date(req.body.date_of_death);
      if (date_of_death >= date_of_birth) {
        const new_death = new Death({
          gravesite_id: graveSite._id,
          deathcause_id: deathCause._id,
          member_id: req.body.member_id,
          tree_id: member.tree_id,
          date_of_death: req.body.date_of_death,
          time_of_death: req.body.time_of_death,
        });

        member.death_id = new_death._id;
        member.alive = false;

        await new_death.save();
        await member.save();
        res.json({
          success: true,
        });
      } else throw new Error("Invalid DateOfDeath");
    } else throw new Error("Member not Found");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/death/delete", fetchUser, fetchEditMember, async (req, res) => {
  try {
    const member = await Member.findById(req.body.member_id);
    if (!member) throw new Error("Member not Found");
    if (member.death_id) {
      const death = await Death.findById(member.death_id);
      if (!death) throw new Error("Death not Found");
      await Death.deleteOne({
        _id: death._id,
      });
      member.alive = true;
      member.death_id = "";
      await member.save();
      res.json({
        success: true,
      });
    } else throw new Error("Death Id not Found");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/death/update", fetchUser, fetchEditMember, async (req, res) => {
  try {
    const member = await Member.findOne({
      _id: req.body.member_id,
    });

    if (member) {
      const death = await Death.findOne({ _id: member.death_id });
      if (death) {
        const graveSite = await GraveSite.findOne({
          _id: req.body.gravesite_id,
        });

        const deathCause = await DeathCause.findOne({
          _id: req.body.deathcause_id,
        });

        const date_of_birth = new Date(member.date_of_birth);
        const date_of_death = new Date(req.body.date_of_death);
        if (graveSite && deathCause && date_of_death > date_of_birth) {
          death.deathcause_id = deathCause._id;
          death.gravesite_id = graveSite._id;
          death.date_of_death = req.body.date_of_death;
          death.time_of_death = req.body.time_of_death;
          await death.save();
          res.json({ success: true });
        } else
          throw new Error(
            "GraveSite or DeathCause not Found or Invalid DateOfDeath"
          );
      } else throw new Error("Death not Found");
    } else throw new Error("Member not Found");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/api/report/member", fetchUser, fetchViewTreeId, async (req, res) => {
  try {
    const { start_year, end_year, tree_id } = req.body;

    if (!start_year || !end_year || !tree_id) {
      return res.status(400).json({
        success: false,
        message: "Missing start_year, end_year, or tree_id in request body",
      });
    }

    const start = String(start_year);
    const end = String(end_year);
    const objectTreeId = mongoose.Types.ObjectId.createFromHexString(tree_id);

    const buildYearAggregation = (fieldPath) => [
      {
        $match: {
          tree_id: { $in: [objectTreeId, tree_id] },
          [fieldPath]: { $ne: null, $type: "string" },
        },
      },
      {
        $project: {
          year: { $arrayElemAt: [{ $split: [`$${fieldPath}`, "-"] }, 0] },
        },
      },
      {
        $match: {
          year: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$year",
          count: { $sum: 1 },
        },
      },
    ];

    const [birthCounts, deathCounts, marriageCounts] = await Promise.all([
      Member.aggregate(buildYearAggregation("date_of_birth")),
      Death.aggregate(buildYearAggregation("date_of_death")),
      Relationship.aggregate(buildYearAggregation("data.date_of_marriage")),
    ]);

    const birthMap = Object.fromEntries(
      birthCounts.map((item) => [item._id, item.count])
    );
    const deathMap = Object.fromEntries(
      deathCounts.map((item) => [item._id, item.count])
    );
    const marriageMap = Object.fromEntries(
      marriageCounts.map((item) => [item._id, item.count])
    );

    const result = [];
    for (let y = parseInt(start); y <= parseInt(end); y++) {
      const yearStr = String(y);
      result.push({
        year: yearStr,
        birth: birthMap[yearStr] || 0,
        death: deathMap[yearStr] || 0,
        marriage: marriageMap[yearStr] || 0,
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.post(
  "/api/report/achievement",
  fetchUser,
  fetchViewTreeId,
  async (req, res) => {
    try {
      const { start_year, end_year, tree_id } = req.body;

      if (!start_year || !end_year || !tree_id) {
        return res.status(400).json({
          success: false,
          message: "Missing start_year, end_year, or tree_id in request body",
        });
      }

      const start = String(start_year);
      const end = String(end_year);
      const objectTreeId = mongoose.Types.ObjectId.createFromHexString(tree_id);

      const buildYearAggregation = () => [
        {
          $match: {
            tree_id: { $in: [objectTreeId, tree_id] },
          },
        },
        {
          $project: {
            year: { $arrayElemAt: [{ $split: [`$date`, "-"] }, 0] },
            type: 1,
          },
        },
        {
          $match: {
            year: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ];

      const [achievementCounts] = await Promise.all([
        Achievement.aggregate(buildYearAggregation()),
      ]);

      const achievementMap = Object.fromEntries(
        achievementCounts.map((item) => [item._id, item.count])
      );

      const achievementTypeList = await AchievementType.find();

      const result = [];
      for (const achievementType of achievementTypeList) {
        result.push({
          type: achievementType.name,
          count: achievementMap[achievementType._id] || 0,
        });
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Listening to the server
server.listen(port, (err) => {
  if (err) {
    console.log("Error in connecting to the server");
  } else {
    console.log("Server is running on port: " + port);
  }
});
