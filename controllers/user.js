const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const User = require('../models/user');
const Conversation = require('../models/conversation');

exports.signup = (req,res) => {
    const { username, email, password } = req.body;
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hash) => {
      const user = new User({
        username,
        email,
        password: hash
      });
      user.save()
        .then(() => {
          const verificationToken = jwt.sign({id: user.id}, process.env.JWT_VERIFICATION_SECRET, {expiresIn: 86400});
          const url = `${process.env.HOME_URL}/user/verification/${verificationToken}`;
          const html =
            `<table style="width: 100%;">
              <tr>
                <td style="text-align: center;">
                  <img style="width:50px;border-radius:4px;" src="https://res.cloudinary.com/dce1p308g/image/upload/v1534873294/logo3.png" alt="apple_icon_57x57" border="0">
                </td>
              </tr>
              <tr>
                <td style="text-align: center; font-family: 'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;
                  font-weight: 300; color: #294661!important;">
                  <h2>You're on your way! Let's confirm your email address.</h2>
                  <p>By clicking on the following link, you are confirming your email address.</p>
                </td>
              </tr>
              <tr>
                <td style="text-align: center;">
                  <a style="box-sizing: border-box; border-color: #348eda; font-weight: 400; text-decoration: none;
                    display: inline-block; margin: 0; color: #ffffff; background-color: #323F57;
                    border-radius: 2px; font-size: 14px; padding: 12px 45px;"
                    href="${url}">Confirm Email Address</a>
                </td>
              </tr>
            </table>`;
          const sgMail = require('@sendgrid/mail');
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          const msg = {
            to: user.email,
            from: 'no-reply@chatter.io',
            subject: 'Welcome to Chatter! Confirm Your Email',
            html
          };
          sgMail.send(msg);
          res.send({
            user
          });
        }).catch(err => {
          console.log(err)
          res.status(500).send(err)
        });
    });
}

exports.verification = (req,res) => {
  try {
    const { id } = jwt.verify(req.params.token, process.env.JWT_VERIFICATION_SECRET);
    User.findByIdAndUpdate(id, {$set: {'isVerified': true }}, {new: true}).then(user => {
      res.redirect('https://chatter.cf');
    }).catch(err => {
      throw error;
    });
  } catch(err) {
    res.status(500).send(err);
  }
}

exports.login = (req,res) => {
  const { username, password } = req.body;
  User.findByCredentials(username, password).then(user => {
    console.log(user)
    user.generateTokens().then(({accessToken, refreshToken, refreshTokenExpiration}) => {
      res.header('Authorization', `Bearer ${accessToken}`).send({
        refreshToken,
        refreshTokenExpiration,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          friends: user.friends
        }
      });
    });
  }).catch(err => {
    res.status(500).send(err);
  });
}

exports.refreshTokens = (req,res) => {
  const { refreshToken } = req.body;
  User.findByToken('refresh', refreshToken).then(user => {
    return user.generateTokens().then(({accessToken, refreshToken, refreshTokenExpiration}) => {
      res.header('Authorization', `Bearer ${accessToken}`).send({
        refreshToken,
        refreshTokenExpiration
      });
    });
  }).catch(err => {
    res.status(401).send({error: 'refresh token expired'});
  });
}

exports.findUsers = (req,res) => {
  const searchRegExp = new RegExp(req.params.searchPhrase, 'i');
  User.find({'username': {$regex: searchRegExp}}).then(users => {
    res.send({users});
  }).catch(err => {
    res.status(500).send(err);
  });
}

exports.addFriend = (req,res) => {
  const { user } = req.body;
  const { _id, username, email } = req.user;
  const me = { _id, username, email };
  const conversationId = uuidv4();
  const conversation = new Conversation({
    participants: [user._id, me._id]
  });
  conversation.save().then(() => {
    User.findByIdAndUpdate(user._id, {$push: {friends: me._id, conversations: conversation._id}}, {new: true}).then(user => {
      console.log('friend', user);
    }).catch(err => {
      res.status(500).send(err);
    });
    User.findByIdAndUpdate(me._id, {$push: {friends: user._id, conversations: conversation._id}}, {new: true}).populate('friends', '_id username email conversations').populate('conversations users messages').then(user => {
      console.log('me', user);
      res.send({user});
    }).catch(err => {
      res.status(500).send(err);
    });
  }).catch(err => {
    console.log(err);
  })
}
