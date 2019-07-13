'use strict';

/*
 * Module dependencies.
 */

const users = require('../app/controllers/users');
const models = require('../app/controllers/models');
const auth = require('./middlewares/authorization');

/**
 * Route middlewares
 */

const modelAuth = [auth.requiresLogin, auth.model.hasAuthorization];

const fail = {
  failureRedirect: '/login'
};

/**
 * Expose routes
 */

module.exports = function(app, passport) {
  const pauth = passport.authenticate.bind(passport);

  // user routes
  app.get('/login', users.login);
  app.get('/signup', users.signup);
  app.get('/logout', users.logout);
  app.post('/users', users.create);
  app.post(
    '/users/session',
    pauth('local', {
      failureRedirect: '/login',
      failureFlash: 'Invalid email or password.'
    }),
    users.session
  );
  app.get('/users/:userId', users.show);
  app.get('/auth/github', pauth('github', fail), users.signin);
  app.get('/auth/github/callback', pauth('github', fail), users.authCallback);
 
  app.param('userId', users.load);

  // model routes
  app.param('id', models.load);
  app.get('/models', auth.requiresLogin, models.index);
  app.get('/models/new', auth.requiresLogin, models.new);
  app.post('/models', auth.requiresLogin, models.create);
  app.get('/models/:id', modelAuth, models.show);
  app.get('/models/:id/code', modelAuth, models.get_code);
  app.get('/models/:id/compile', modelAuth, models.compile);
  app.post('/models/:id/code', modelAuth, models.save_code);
  app.post('/models/:id/data', modelAuth, models.save_data);
  app.post('/models/:id/fit', modelAuth, models.run_model);
  app.get('/models/:id/fit', modelAuth, models.get_fit);
  app.get('/models/:id/edit', modelAuth, models.edit);
  app.put('/models/:id', modelAuth, models.update);
  app.delete('/models/:id', modelAuth, models.destroy);

  // home route
  app.get('/', (req, res) => {
    res.render('index', {
      title: 'cloudstan'
    });
  });

  
  /**
   * Error handling
   */

  app.use(function(err, req, res, next) {
    // treat as 404
    if (
      err.message &&
      (~err.message.indexOf('not found') ||
        ~err.message.indexOf('Cast to ObjectId failed'))
    ) {
      return next();
    }

    console.error(err.stack);

    if (err.stack.includes('ValidationError')) {
      res.status(422).render('422', { error: err.stack });
      return;
    }

    // error page
    res.status(500).render('500', { error: err.stack });
  });

  // assume 404 since no middleware responded
  app.use(function(req, res) {
    const payload = {
      url: req.originalUrl,
      error: 'Not found'
    };
    if (req.accepts('json')) return res.status(404).json(payload);
    res.status(404).render('404', payload);
  });
};
