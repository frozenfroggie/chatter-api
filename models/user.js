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

UserSchema.statics.findByCredentials = (username, password) => {
  const User = this;
  User.findOne({username, password}).then(user => {
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

const User = mongoose.model('User', UserSchema);

module.exports = User;
