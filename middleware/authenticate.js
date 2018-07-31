const User = require('../models/user');

const authenticate = (req,res,next) => {

  let accessToken;
  try {
    accessToken = req.headers['authorization'].split(' ')[1];
    // console.log('authenticate', accessToken);
  } catch(err) {
    //ignore if token occurs undefined and split can't work
  }

  User.findByToken('access', accessToken)
    .then(user => {
      // console.log('authenticate', user);
      if(!user) {
        return Promise.reject();
      } else {
        // console.log('auth token used');
        req.user = user;
        next();
      }
    }).catch(err => {
      console.log(err);
      res.status(401).send({error: 'auth token expired'});
    });

}

module.exports = authenticate;
