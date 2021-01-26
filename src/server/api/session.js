/* eslint-disable no-console */
const Joi = require('@hapi/joi');

const MAX_LOGIN_ATTEMPTS = 3;

module.exports = (app) => {
  /**
   * @description Log a user in
   *
   * @param {req.body.username}
   * @param {req.body.password}
   * @return { 200, {username, email, date} }
   */
  app.post('/session', async (req, res) => {
    // Validate incoming request has username and password,
    // if not return 400:'username and password are required'
    const schema = Joi.object().keys({
      username: Joi.string().lowercase().required(),
      password: Joi.string().required(),
    });
    try {
      const data = await schema.validateAsync(req.body);
      // Search database for user
      const user = await app.models.User.findOne({ username: data.username });
      // If not found, return 401:unauthorized
      if (!user) {
        res.status(401).send({
          error:
            'Unauthorized, username incorrect/not found. Please try again or register.',
        });
      } else if (user.deactivate) {
        res.status(401).send({
          error: 'Unauthorized, account deactivated. Please register.',
        });
      } else if (user.isLocked) {
        // Check if the account is currently locked
        // Increment login attempts if account is already locked
        user.incLoginAttempts(() => {
          res.status(401).send({
            error:
              'Unauthorized, maximum login attempts exceeded. Please come back after 1 minute or reset password.',
          });
        });
      } else if (user.authenticate(data.password)) {
        // If found, compare hashed passwords
        // Regenerate session when signing in to prevent fixation
        req.session.regenerate(() => {
          req.session.user = user;
          console.log(`Session.login success: ${req.session.user.username}`);
          // If there's no lock or failed attempts and
          // if a match, return 201:{ username, email, date }
          if (!user.loginAttempts && !user.lockUntil) {
            // Reset attempts and lock info
            const updates = {
              $set: { loginAttempts: 0 },
              $unset: { lockUntil: 1 },
            };
            user.update(updates, () => user);
          }
          res.status(200).send({
            username: user.username,
            email: user.email,
            date: user.date,
            image: user.image,
          });
        });
      } else {
        // If not a match, return 401:unauthorized
        console.log('Session.login failed. Incorrect credentials.');
        user.incLoginAttempts(() => {
          res.status(401).send({
            error: `Unauthorized, password incorrect. Maximum number of login attempts is ${MAX_LOGIN_ATTEMPTS}.`,
          });
        });
      }
    } catch (err) {
      const { message } = err.details[0];
      console.log(`Session.login validation failure: ${message}`);
      res.status(400).send({ error: message });
    }
  });

  /**
   * @description Log a user out
   *
   * @return { 204 if was logged in, 200 if no user in session }
   */
  app.delete('/session', (req, res) => {
    if (req.session.user) {
      req.session.destroy(() => {
        res.status(204).end();
      });
    } else {
      res.status(200).end();
    }
  });
};
