const mongoose = require('mongoose');

// Create Schema
const UserSchema = new mongoose.Schema({
  name:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true
  },
  password:{
    type: String,
    required: true
  },
  role:{
    type: String
  }
});

mongoose.model('User', UserSchema);
