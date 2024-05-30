const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  id: {type: String, required: true},
  user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
  products: Object,
  total: Number,
  fullname: String,
  email: String,
  phone: String,
  address: String,
  province: String,
  city: String,
  ward: String,
  time: String,
  status: String,
  payment: String,
}, {timestamps: true
});

const MessageModel = mongoose.model('order', OrderSchema);

module.exports = MessageModel;