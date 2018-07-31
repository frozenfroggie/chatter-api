const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Schema = mongoose.Schema;

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    trim: true
  },
  email:  {
    type: String,
    unique: true,
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
    refreshTokenExpiration: {
      type: Number
    },
    verificationToken: {
      type: String
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  friends: [{type: Schema.Types.ObjectId, ref: 'User'}],
  conversations: [{type: Schema.Types.ObjectId, ref: 'Conversation'}]
});

UserSchema.statics.findByCredentials = function(username, password) {
  const User = this;
  return User.findOne({username}).populate('friends', '_id username email conversations').populate({path: 'conversations', populate: {path: 'users'}}).then(user => {
    if(!user) {
      return Promise.reject({ type: 'no-user-found' });
    }
    if(!user.isVerified) {
      return Promise.reject({ type: 'not-verified', msg: 'Please confirm your email address first' });
    }
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password).then(res => res ? resolve(user) : reject({ type: 'invalid-password' }));
    });
  });
}

UserSchema.statics.findByToken = function(type, token) {
  const User = this;
  const secret = type === 'access' ? process.env.JWT_AUTHENTICATION_SECRET : process.env.JWT_REFRESH_SECRET;
  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch(err) {
    return Promise.reject(err);
  }
  return User.findById(decoded._id).then(user => user).catch(err => Promise.reject(err));
}

UserSchema.methods.generateTokens = function() {
  const user = this;

  const accessTokenExpiration = 60;
  const accessToken = jwt.sign({_id: user._id.toHexString(), email: user.email, username: user.username}, process.env.JWT_AUTHENTICATION_SECRET, {
    expiresIn: accessTokenExpiration
  });

  const refreshTokenExpiration = 604800;
  const refreshToken = jwt.sign({_id: user._id.toHexString()}, process.env.JWT_REFRESH_SECRET, {
    expiresIn: refreshTokenExpiration
  });

  user.tokens = { accessToken, refreshToken, refreshTokenExpiration };
  return user.save().then(() => user.tokens);
}

const User = mongoose.model('User', UserSchema);

module.exports = User;
