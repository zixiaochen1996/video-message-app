/* eslint-disable func-names */
const mongoose = require('mongoose');
const crypto = require('crypto');
const moment = require('moment');

const { Schema } = mongoose;
const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_TIME = (1 / 60) * 60 * 60 * 1000; // 60 seconds
/** 1 hour - use the following
 * const LOCK_TIME = 1 * 60 * 60 * 1000;
 */

// Encrypt password
const makeSalt = () => `${Math.round(new Date().valueOf() * Math.random())}`;

const encryptPassword = (salt, password) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  crypto.createHmac('sha512', salt).update(password).digest('hex');

const reservedNames = ['password'];

// Create user model
const User = new Schema({
  username: { type: String, required: true, index: { unique: true } },
  email: { type: String, required: true, index: { unique: true } },
  salt: { type: String, required: true },
  hash: { type: String, required: true },
  date: { type: String, default: moment().format() },
  image: { type: String },
  loginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: { type: Number },
  deactivate: { type: Boolean, default: false },
  contacts: { type: Array },
  statuses: { type: Array },
  chatrooms: { type: Array },
  socketID: { type: String },
});

User.path('username').validate((value) => {
  if (!value) return false;
  if (reservedNames.indexOf(value) !== -1) return false;
  return (
    value.length >= 3 && value.length <= 15 && /^[a-zA-Z0-9]+$/i.test(value)
  );
}, 'Username is invalid.');

User.path('email').validate(
  (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  // eslint-disable-next-line comma-dangle
  'Email address is invalid.',
);

User.virtual('password').set(function (password) {
  this.salt = makeSalt();
  this.hash = encryptPassword(this.salt, password);
});

User.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

User.method('authenticate', function (plainText) {
  return encryptPassword(this.salt, plainText) === this.hash;
});

// Increment login attempts
User.method('incLoginAttempts', function (callback) {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.update(
      {
        $set: { loginAttempts: 1 },
        $unset: { lockUntil: 1 },
      },
      // eslint-disable-next-line comma-dangle
      callback,
    );
  }
  // Otherwise we're incrementing
  const updates = { $inc: { loginAttempts: 1 } };
  // Lock the account if we've reached max attempts and it's not locked already
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }
  return this.update(updates, callback);
});

User.pre('save', function (next) {
  // Sanitize strings
  const rand = Math.floor(Math.random() * Math.floor(10000));
  this.username = this.username.toLowerCase();
  this.email = this.email.toLowerCase();
  this.date = this.date.substring(0, 10);
  this.image = `https://gravatar.com/avatar/${rand}?d=identicon`;
  next();
});

module.exports = mongoose.model('User', User);
