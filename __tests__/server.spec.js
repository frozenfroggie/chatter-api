const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');

const User = require('../models/user');
const app = require('../server');
const {populateUsers, users} = require('./seed');

beforeEach(populateUsers);

describe('POST /user/signup', () => {
  it('should put user into database and return user', (done) => {
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

describe('POST /user/login', () => {
  it('should return accessToken, expiresIn and refreshToken', (done) => {
    const username = 'kubaa';
    const password = '123mnb!';
    request(app)
      .post('/user/login')
      .send({username, password})
      .expect(200)
      .expect(res => {
        expect(res.body.accessToken).to.be.ok;
        expect(res.body.expiresIn).to.be.a('number');
        expect(res.body.refreshToken).to.be.ok
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        done();
        // User.findById(users[0]._id).then(user => {
        //   const authToken = user.tokens.authToken;
        //   const refreshToken = user.tokens.refreshToken;
        //   expect(authToken).to.be.equal(res.body.accessToken);
        //   expect(refreshToken).to.be.equal(res.body.refreshToken);
        //   done();
        // }).catch((e) => done(e));
      });
  });
});
