'use strict';

/**
 * Expose
 */

module.exports = {
  db: process.env.MONGODB_URL,
  github: {
    clientID: process.env.GITHUB_CLIENTID,
    clientSecret: process.env.GITHUB_SECRET,
    callbackURL:
      'https://nodejs-express-demo.herokuapp.com/auth/github/callback'
  },
  google: {
    clientID: process.env.GOOGLE_CLIENTID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL:
      'https://nodejs-express-demo.herokuapp.com/auth/google/callback'
  }
};
