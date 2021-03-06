var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	npmlog = require('npmlog'),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	userDao = require('../../persistence/userDao'),
	userConverter = require('../../converters/userConverter'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/users');

module.exports = function (app) {
  //app.use(resourceService.basePath, router);
};

router.route('/')
	.get(function(req, res, next) {
		userDao
			.findAll()
			.then(function(users) {
				return resourceService.ok(res,
					_.map(users, function(user) {
						return userConverter.convert(user);
					})
				);
			})
			.then(null, function(err) {
				return next(err);
			});
	})

	.post(function(req, res, next) {
		var user = req.body;

		userDao
			.createAndSave(user)
			.then(function(userSaved) {
				return resourceService.location(res, 201, userSaved).end();
			})
			.catch(ValidationError, function(e) {
				return resourceService.validationError(res, e);
			})
			.error(function(err) {
				npmlog.error(err);
				return next(err)
			});
	});

router.route('/:id')
	.get(function(req, res, next) {
		return userDao
			.findById(req.params.id)
			.then(function(user) {
				if (user) {
					return resourceService.ok(res, userConverter.convert(user));
				}
				else {
					return resourceService.notFound(res);
				}
			});
	})

	.patch(function(req, res, next) {
		userDao
			.findById(req.params.id)
			.then(function(user) {
				var data = req.body;

				if (data.firstName !== undefined) {
					user.set('firstName', data.firstName);
				}

				if (data.lastName !== undefined) {
					user.set('lastName', data.lastName);
				}

				if (user.hasChanged()) {
					return userDao
						.save(user)
						.then(function() {
							return resourceService.location(res, 201, user).end();
						})
						.catch(ValidationError, function(e) {
							return resourceService.validationError(res, e);
						});
				}
				else {
					return resourceService.location(res, 304, user).end();
				}
			})
			.then(null, function(err) {
				next(err);
			});
	});