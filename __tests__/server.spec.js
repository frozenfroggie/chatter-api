const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');

const User = require('../models/user');
const app = require('../server');
const {populateUsers, users} = require('./seed');

beforeEach(populateUsers);

describe('POST /user/signup [User is able to signup]', () => {
  it('should put user into db and return this user', (done) => {
    const username = 'kubaa';
    const email = 'example@example.com';
    const password = '123mnb!';
    request(app)
      .post('/user/signup')
      .send({username, email, password})
      .expect(200)
      .expect(res => {
        expect(res.body.user._id).to.be.ok;
        expect(res.body.user.email).to.be.equal(email);
        expect(res.body.user.username).to.be.equal(username);
      })
      .end(err => {
        if (err) {
          return done(err);
        }
        User.findOne({username, email}).then(user => {
          expect(user).to.be.ok;
          done();
        }).catch(e => done(e));
      });
  });
});

describe('POST /user/login [User is able to login]', () => {
  it('should find user, save new tokens in db and return these tokens', (done) => {
    const username = users[0].username;
    const password = 'userOnePass';
    request(app)
      .post('/user/login')
      .send({username, password})
      .expect(200)
      .expect(res => {
        expect(res.headers.authorization).to.be.ok;
        expect(res.body.refreshToken).to.be.ok;
        expect(res.body.refreshTokenExpiration).to.be.a('number');
        expect(res.body.user).to.be.ok;
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        User.findById(users[0]._id).then(user => {
          const accessToken = user.tokens.accessToken;
          const refreshToken = user.tokens.refreshToken;
          expect(accessToken).to.be.equal(res.headers.authorization.split(' ')[1]);
          expect(accessToken).to.not.be.equal(users[0].tokens.accessToken);
          expect(refreshToken).to.be.equal(res.body.refreshToken);
          expect(refreshToken).to.not.be.equal(users[0].tokens.refreshToken);
          done();
        }).catch((e) => done(e));
      });
  });
});

describe('GET /user/verification [User is able to verify email]', () => {
  it('should change user.isVerified to true and redirect to home url', (done) => {
    request(app)
      .get(`/user/verification/${users[1].tokens.verificationToken}`)
      .expect(302)
      .expect('Location', process.env.HOME_URL)
      .end((err,res) => {
        if(err) {
          return done(err);
        }
        User.findById(users[1]._id).then(user => {
          expect(user.isVerified).to.be.true;
          done();
        })
      });
  });
});

describe('GET /user/find/:searchPhrase [User is able to search for other users by search phrase]', () => {
  it('should find 1 user that matches search phrase "first" and return it', (done) => {
    request(app)
      .get('/user/find/first')
      .expect(200)
      .expect(res => {
        expect(res.body.users).to.be.ok;
        expect(res.body.users.length).to.be.equal(1);
      })
      .end(done);
  });
  it('should find 2 users that matches search phrase "user" and return them', (done) => {
    request(app)
      .get('/user/find/user')
      .expect(200)
      .expect(res => {
        expect(res.body.users).to.be.ok;
        expect(res.body.users.length).to.be.equal(2);
      })
      .end(done);
  });
});

describe('POST /user/friend/add [User is able to add new friend]', () => {
  it('should return user with updated friends array', (done) => {
      request(app)
        .post('/user/friend/add')
        .set({'Authorization': `Bearer ${users[0].tokens.accessToken}`})
        .expect(200)
        .expect(res => {
          expect(res.body.user).to.be.ok;
        })
        .end((err, res) => {
          expect(res.body.user.friends.length).to.be.equal(1);
          done();
        });
  });
});
