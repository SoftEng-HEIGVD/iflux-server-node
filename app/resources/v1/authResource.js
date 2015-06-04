var
	_ = require('underscore'),
	jwt = require('jsonwebtoken'),
	expressJwt = require('express-jwt'),
	config = require('../../../config/config'),
	express = require('express'),
	npmlog = require('npmlog'),
  router = express.Router(),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	userDao = require('../../persistence/userDao'),
	securityService = require('../../services/securityService'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/auth');

module.exports = function (app) {
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
					return resourceService.notAuthorized(res).end();
				}
			})
			.catch(userDao.model.NotFoundError, function(err) {
				return resourceService.notAuthorized(res).end();
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
				npmlog.error(err);
				return next(err)
			});
	});
