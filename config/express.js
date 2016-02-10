var s = require('underscore.string');
var express = require('express');
var glob = require('glob');

var cors = require('cors');

var favicon = require('serve-favicon');
var logger = require('morgan');
var npmlog = require('npmlog');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compress = require('compression');
var methodOverride = require('method-override');

module.exports = function(app, config) {
  app.set('views', config.root + '/app/views');
  app.set('view engine', 'jade');

  var env = process.env.NODE_ENV || 'development';
  app.locals.ENV = env;
  app.locals.ENV_DEVELOPMENT = env == 'development';

	app.locals.config = config;

  if (env == 'development' || (env == 'test' && config.app.debug)) {
    var knexLogger = require('knex-logger');
    app.use(knexLogger(app.get('bookshelf').knex));
  }

	app.use('/v1/*', cors());

	app.use(function(req, res, next) {
		var contextRoot = req.headers['x-context-root'];

		if (contextRoot) {
			if (contextRoot.indexOf('/', contextRoot.length - 1) !== -1) {
				contextRoot = contextRoot.substr(0, contextRoot.length - 2);
			}

			if (contextRoot.indexOf('/') === 0) {
				app.locals.contextRoot = contextRoot;
			}
			else {
				app.locals.contextRoot = '/' + contextRoot;
			}
		}
		else {
			app.locals.contextRoot = '';
		}

		next();
	});

  // app.use(favicon(config.root + '/public/img/favicon.ico'));
  if (env != 'test' || (config.app.debug && env == 'test')) {
	  app.use(logger('dev'));
  }

	if (!config.app.debug && env == 'test') {
		npmlog.level = 'silent';
	}

	app.use(bodyParser.json());

  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });

  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(cookieParser());
  app.use(compress());
  //app.use(express.static(config.root + '/public'));
  app.use(methodOverride());

	// No more controllers
  //var controllers = glob.sync(config.root + '/app/controllers/*.js');
  //controllers.forEach(function (controller) {
  //  require(controller)(app);
  //});

	var middlewares = glob.sync(config.root + '/app/resources/**/*.js');
	middlewares.forEach(function (middleware) {
		if (s.endsWith(middleware, 'Middleware.js')) {
			require(middleware)(app);
		}
	});

	var resources = glob.sync(config.root + '/app/resources/**/*.js');
	resources.forEach(function (resource) {
		if (s.endsWith(resource, 'Resource.js')) {
			require(resource)(app);
		}
	});

  app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
};
