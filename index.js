const port = 4000;
const http = require("http");
const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const imgur = require("imgur");
const fs = require("fs");

let isAdminExist = false;

const server = http.createServer(app);
// Pass a http.Server instance to the listen method
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const uuid = require("uuid");

const User = require("./models/User");
const TreeInfo = require("./models/TreeInfo");
const Member = require("./models/Member");
const Relationship = require("./models/Relationship");

var secretKey = "family_tree";

require("dotenv/config");
// const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API } = process.env;

app.use(express.json());
app.use(cors());

// UID Generation
function generateID() {
  return uuid.v4();
}

// Database connection with MongoDB
// MongoDB_URI = "mongodb+srv://baolongvncom:baolong123456@cluster0.0vgsjr7.mongodb.net/FamilyTree";
MongoDB_URI = "mongodb://localhost:27017/FamilyTree";
mongoose.connect(MongoDB_URI);

async function updateFields(model, id, fields) {
  try {
    if (!model || !id || !fields || Object.keys(fields).length === 0) {
      throw new Error("Thiếu thông tin cập nhật.");
    }

    const updatedRecord = await model.findByIdAndUpdate(id, fields, {
      new: true,
    });

    return !!updatedRecord;
  } catch (error) {
    console.error("Lỗi cập nhật bản ghi:", error);
    return false;
  }
}

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
// app.use("/images", express.static("upload/images"));

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

      const userRole = tree.role?.[req.user.email];

      if (userRole === "owner" || userRole === "editor") {
        return next();
      }

      res.status(403).json({
        success: false,
        message: "You do not have permission to edit this tree",
      });
    } catch (error) {
      res.send({
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

      const userRole = tree.role?.[req.user.email];

      if (
        userRole === "owner" ||
        userRole === "editor" ||
        userRole === "viewer"
      ) {
        return next();
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

      const userRole = tree.role?.[req.user.email];

      if (
        userRole === "owner" ||
        userRole === "editor" ||
        userRole === "viewer"
      ) {
        return next();
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

// Admin signup
app.get("/api/adminsignup", async (req, res) => {
  let check = await User.findOne({ email: "admin" });
  if (check) {
    res.json({ success: false, message: "Admin already exists" });
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
            admin: true,
          })
        : res.json({
            success: true,
            token: token,
            admin: false,
          });
    } else {
      res.json({
        success: false,
        message: "Invalid Password",
      });
    }
  } else {
    res.json({
      success: false,
      message: "User not found",
    });
  }
});

app.get("/api/isadmin", fetchAdmin, async (req, res) => {
  res.json({ success: true });
});

app.get("/api/isuser", fetchUser, async (req, res) => {
  res.json({
    success: true,
    email: req.user.email,
    username: req.user.username,
  });
});

app.post("/api/upload", upload.single("treeInfo"), (req, res) => {
  imgur
    .uploadFile(`./upload/images/${req.file.filename}`)
    .then((json) => {
      console.log(JSON.stringify(json, null, 2));
      console.log("imgur link: ", json.link);
      res.json({
        success: 1,
        image_url: json.link,
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

app.post("/api/treeinfo/add", fetchUser, async (req, res) => {
  const new_code = await generateUniqueCode();
  const treeInfo = new TreeInfo({
    name: req.body.name,
    code: new_code,
    image: req.body.image,
    description: req.body.description,
    role: req.body.role,
  });
  await treeInfo.save();
  console.log("New Tree Saved", treeInfo);
  res.json({
    success: true,
  });
});

app.get("/api/treeinfo/get", fetchUser, async (req, res) => {
  try {
    const treeInfos = await TreeInfo.find();
    const filteredTreeInfos = treeInfos
      .filter(
        (info) => info.role && Object.keys(info.role).includes(req.user.email)
      )
      .map((info) => ({
        ...info.toObject(),
        role: info.role[req.user.email],
      }));

    res.json({ success: 1, treeInfos: filteredTreeInfos });
  } catch (error) {
    console.error("Error fetching TreeInfos:", error);
    res.status(500).json({ success: 0, message: "Internal Server Error" });
  }
});

app.post("/api/treeinfo/find", fetchUser, async (req, res) => {
  try {
    const treeInfo = await TreeInfo.findOne({ code: req.body.code });
    res.json({ success: 1, treeInfo });
  } catch (error) {
    console.error("Error fetching TreeInfos:", error);
    res.status(500).json({ success: 0, message: "Internal Server Error" });
  }
});

app.post("/api/family/get", fetchUser, fetchViewTreeId, async (req, res) => {
  try {
    const family = await Member.find({ tree_id: req.body.tree_id });
    // const tree = await TreeInfo.findOne({ _id: req.body.tree_id });


    res.json({
      success: true,
      family,
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
    const member = new Member({
      tree_id: req.body.tree_id,
      full_name: req.body.full_name,
      date_of_birth: req.body.date_of_birth,
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
    res.json({
      success: true,
      member,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

app.get("/api/member/getunmarried", fetchUser, async (req, res) => {
  try {
    const members = await Member.find({ married: false });
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

app.get("/api/member/getcouples", fetchUser, async (req, res) => {
  try {
    const relationships = await Relationship.find();

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

app.get("/api/member/getunparents", fetchUser, async (req, res) => {
  try {
    const members = await Member.find({ being_child: false });
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
              },
            },
          });
        }
      } else throw new Error("Member  Not Found");
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
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
  fetchViewMember,
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
  fetchViewMember,
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
  fetchViewMember,
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
  fetchViewMember,
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

// Listening to the server
server.listen(port, (err) => {
  if (err) {
    console.log("Error in connecting to the server");
  } else {
    console.log("Server is running on port: " + port);
  }
});
