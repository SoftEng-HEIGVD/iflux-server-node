var
	expressJwt = require('express-jwt'),
	config = require('../../config/config'),
	express = require('express'),
	userDao = require('../persistence/userDao'),
	resourceService = require('../services/resourceServiceFactory')('/');

module.exports = function (app) {
	app
		.use(expressJwt({ secret: config.app.jwtSecret })
		.unless({ path: [
			'/v1/auth/signin',
			'/v1/auth/register',
      '/v1/events'
		]}));

		app.use(function(req, res, next) {
			if (req.user) {
				return userDao
					.findBy({ email: req.user.email })
					.then(function(user) {
						req.userModel = user;
						return next();
					})
					.catch(userDao.model.NotFoundError, function(err) {
						resourceService.notAuthorized(res).end();
					});
			}
			else {
				return next();
			}
		});

	app.use(function (err, req, res, next) {
	  if (err.name === 'UnauthorizedError') {
			resourceService.notAuthorized(res).end();
	  }
	});
};
