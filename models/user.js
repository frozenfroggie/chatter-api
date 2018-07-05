const mongoose = require('mongoose');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true
  },
  email:  {
    type: String,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String
  },
  tokens: {
    accessToken: {
      type: String
    },
    refreshToken: {
      type: String
    },
    verificationToken: {
      type: String
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
