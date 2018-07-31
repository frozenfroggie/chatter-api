const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

const userOneId = mongoose.Types.ObjectId();
const userTwoId = mongoose.Types.ObjectId();

const userOnePassHashed = bcrypt.hashSync('userOnePass', 10);
const userTwoPassHashed = bcrypt.hashSync('userTwoPass', 10);

const users = [{
  _id: userOneId,
  isVerified: true,
  username: 'firstuser',
  email: 'andrew@example.com',
  password: userOnePassHashed,
  friends: [],
  tokens: {
    accessToken: jwt.sign({_id: userOneId}, process.env.JWT_AUTHENTICATION_SECRET),
    refreshToken: jwt.sign({_id: userOneId}, process.env.JWT_REFRESH_SECRET),
    verificationToken: jwt.sign({id: userOneId}, process.env.JWT_VERIFICATION_SECRET, {expiresIn: 86400})
  }
}, {
  _id: userTwoId,
  isVerified: false,
  username: 'seconduser',
  email: 'jen@example.com',
  password: userTwoPassHashed,
  friends: [],
  tokens: {
    accessToken: jwt.sign({_id: userTwoId}, process.env.JWT_AUTHENTICATION_SECRET),
    refreshToken: jwt.sign({_id: userTwoId}, process.env.JWT_REFRESH_SECRET, {
      expiresIn: 0 //the token expired at the same moment it was created
    }),
    verificationToken: jwt.sign({id: userTwoId}, process.env.JWT_VERIFICATION_SECRET, {expiresIn: 86400})
  }
}];

const populateUsers = done => {
  User.remove({}).then(() => {
    const userOne = new User(users[0]).save();
    const userTwo = new User(users[1]).save();
    return Promise.all([userOne, userTwo])
  }).then(() => done())
    .catch(err => console.log(err));
};

module.exports = {users, populateUsers};
