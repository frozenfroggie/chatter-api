const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

const User = require('../models/user');

router.post('/signup', (req,res) => {
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
        const verificationToken = jwt.sign({id: user.id}, process.env.JWT_VERIFICATION_SECRET, {expiresIn: '1d'});
        const url = `${process.env.HOME_URL}/user/verification/${verificationToken}`;
        const html =
          `<table style="width: 100%;">
            <tr>
              <td style="text-align: center;">
                <img width="50px" src="https://image.ibb.co/fCdOVS/apple_icon_57x57.png" alt="apple_icon_57x57" border="0">
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
                  display: inline-block; margin: 0; color: #ffffff; background-color: rgb(107, 44, 163);
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
        res.status(500).send(err)
      });
  });
});

router.get('/verification/:token', (req, res) => {
  try {
    const { id } = jwt.verify(req.params.token, process.env.JWT_VERIFICATION_SECRET);
    User.findByIdAndUpdate(id, {$set: {'isVerified': true }}, {new: true}).then(user => {
      res.redirect(process.env.HOME_URL);
    }).catch(err => {
      throw error;
    });
  } catch(err) {
    res.send(err);
  }
});

router.post('/login', (req,res) => {
  const { username, password } = req.body;
  User.findByCredentials(username, password).then(user => {
    console.log(user);
    res.send(user);
    // user.generateTokens().then({ accessToken, refreshToken } => {
    //   res.send({
    //     accessToken,
    //     expiresIn: 3600,
    //     refreshToken
    //   });
    // });
  }).catch(err => {
    console.log(err);
    res.send(err);
  });
});

module.exports = router;
