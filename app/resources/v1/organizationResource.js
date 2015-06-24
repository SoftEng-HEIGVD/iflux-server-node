var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	organizationDao = require('../../persistence/organizationDao'),
	organizationConverter = require('../../converters/organizationConverter'),
	userConverter = require('../../converters/userConverter'),
	organizationActionService = require('../../services/organizationActionService'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/organizations');

module.exports = function (app) {
  app.use(resourceService.basePath, router);

	router.param('id', function(req, res, next) {
		return organizationDao
			.findByIdAndUser(req.params.id, req.userModel)
			.then(function (organization) {
				req.organization = organization;
				return next();
			})
			.catch(organizationDao.model.NotFoundError, function (err) {
				return resourceService.forbidden(res).end();
			});
	});
};

router.route('/')
	.get(function(req, res, next) {
		var promise;

		if (req.query.name) {
			promise = organizationDao.findByName(req.query.name);
		}
		else {
			promise = organizationDao.findAll();
		}

		return promise
			.then(function(organizations) {
				return resourceService.ok(res,
					_.map(organizations, function(organization) {
						return organizationConverter.convert(organization);
					})
				);
			})
			.then(null, function(err) {
				return next(err);
			});
	})
	.post(function(req, res, next) {
		var organization = req.body;

		organizationDao
			.createAndSave(organization, req.userModel)
			.then(function(organizationSaved) {
				return resourceService.location(res, 201, organizationSaved).end();
			})
			.catch(ValidationError, function(e) {
				return resourceService.validationError(res, e);
			})
			.error(function(err) {
				return next(err)
			});
	});


router.route('/:id')
	.get(function(req, res, next) {
		return resourceService.ok(res, organizationConverter.convert(req.organization));
	})

	.patch(function(req, res, next) {
		var organization = req.organization;
		var data = req.body;

		if (data.name !== undefined) {
			organization.set('name', data.name);
		}

		if (organization.hasChanged()) {
			return organizationDao
				.save(organization)
				.then(function() {
					return resourceService.location(res, 201, organization).end();
				})
				.catch(ValidationError, function(e) {
					return resourceService.validationError(res, e);
				});
		}
		else {
			return resourceService.location(res, 304, organization).end();
		}
	});

router.route('/:id/users')
	.get(function(req, res, next) {
		req.organization
			.users()
			.fetch()
			.then(function(users) {
				return resourceService.ok(res,
					_.map(users.models, function(user) {
						return userConverter.convert(user);
					})
				);
			})
			.then(null, function(err) {
				return next(err);
			});
	});

router.route('/:id/actions')
	.post(function(req, res, next) {
		if (_.contains(_.keys(organizationActionService), req.body.type)) {
			return organizationActionService[req.body.type](req.body, req.organization, req.userModel)
				.then(function(){
					return resourceService.ok(res).end();
				})
				.catch(ValidationError, function(err) {
					return resourceService.validationError(res, err);
				});
		}
		else {
			return resourceService.validationError(res, { type: [ 'Unknown action type.' ]}).end();
		}
	});
