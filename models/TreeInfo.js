const mongoose = require('mongoose');

// Sechema for Creating TreeInfo
const TreeInfoSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        unique: true,
        required: false,
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
    description: {
        type: String,
        default: "",
    },
    role: {
        type: Object,
        default: {},
        required: true,
    }
}, {timestamps: true});

const TreeInfoModel = mongoose.model('treeInfo', TreeInfoSchema, "treeInfos");
module.exports = TreeInfoModel;