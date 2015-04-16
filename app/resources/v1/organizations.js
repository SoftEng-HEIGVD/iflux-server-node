var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	organizationDao = require('../../persistence/organizationDao'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/organizations');

module.exports = function (app) {
  app.use(resourceService.basePath, router);
};

function convertOrganization(organization) {
	return {
		id: organization.get('id'),
		name: organization.get('name')
	};
}

router.route('/')
	.get(function(req, res, next) {
		organizationDao
			.findAll()
			.then(function(organizations) {
				return resourceService.ok(res,
					_.map(organizations, function(organization) {
						return convertOrganization(organization);
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
			.createAndSave(organization)
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
		return organizationDao
			.findById(req.params.id)
			.then(function(organization) {
				if (organization) {
					return resourceService.ok(res, convertOrganization(organization));
				}
				else {
					return resourceService.notFound(res);
				}
			});
	})

	.patch(function(req, res, next) {
		organizationDao
			.findById(req.params.id)
			.then(function(organization) {
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
			})
			.then(null, function(err) {
				next(err);
			});
	});