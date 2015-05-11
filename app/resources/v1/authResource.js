var
	_ = require('underscore'),
	jwt = require('jsonwebtoken'),
	expressJwt = require('express-jwt'),
	config = require('../../../config/config'),
	express = require('express'),
  router = express.Router(),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	userDao = require('../../persistence/userDao'),
	securityService = require('../../services/securityService'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/auth');

module.exports = function (app) {
	app
		.use(expressJwt({ secret: config.app.jwtSecret })
		.unless({ path: [
			'/v1/auth/signin',
			'/v1/auth/register'
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
						resourceService.unauthorized(res).end();
					});
			}
			else {
				return next();
			}
		});

	app.use(function (err, req, res, next) {
	  if (err.name === 'UnauthorizedError') {
			resourceService.unauthorized(res).end();
	  }
	});

  app.use(resourceService.basePath, router);
};

router.route('/signin')
	.post(function(req, res, next) {
		userDao
			.findBy({ email: req.body.email })
			.then(function(user) {
				if (user && securityService.verify(req.body.password, user.get('passwordHash'))) {
					return res.json({
						token: jwt.sign({
							email: user.get('email'),
							firstName: user.get('firstName'),
							lastName: user.get('lastName')
						}, config.app.jwtSecret, { algorithm: 'HS512', expiresInMinutes: 60 * 24 })
					}).end();
				}
				else {
					return resourceService.unauthorized(res).end();
				}
			})
			.catch(userDao.model.NotFoundError, function(err) {
				return resourceService.unauthorized(res).end();
			});
	});

router.route('/register')
	.post(function(req, res, next) {
		var user = req.body;

		userDao
			.createNotLinkedAndSave(user)
			.then(function(userSaved) {
				return resourceService.customLocation(res, 201, '/v1/me').end();
			})
			.catch(ValidationError, function(e) {
				return resourceService.validationError(res, e);
			})
			.error(function(err) {
				console.log(err);
				return next(err)
			});
	});