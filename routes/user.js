const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const UserController = require('../controllers/user');

router.post('/signup', UserController.signup);

router.get('/verification/:token', UserController.verification);

router.post('/login', UserController.login);

router.post('/refreshTokens', UserController.refreshTokens);

router.get('/find/:searchPhrase', UserController.findUsers);

router.patch('/friend/add', authenticate, UserController.addFriend);

module.exports = router;
