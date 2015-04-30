var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	ValidationError = require('checkit').Error,
	models = require('../../../models/models'),
	organizationConverter = require('../../../converters/organizationConverter'),
	organizationDao = require('../../../persistence/organizationDao'),
	resourceService = require('../../../services/resourceServiceFactory')('/v1/me/organizations');

module.exports = function (app) {
  app.use(resourceService.basePath, router);

	app.param('orgId', function(req, res, next) {
		return organizationDao
			.findByIdAndUser(req.params.orgId, req.userModel)
			.then(function(organization) {
				req.organization = organization;
				return next();
			})
			.catch(organizationDao.model.NotFoundError, function(err) {
				return resourceService.notFound(res, 'Organization not found');
			});
	});
};

router.route('/')
	.get(function(req, res, next) {
		req.userModel
			.organizations()
			.fetch()
			.then(function(organizations) {
				return resourceService.ok(res,
					_.map(organizations.models, function(organization) {
						return organizationConverter.convert(organization);
					})
				);
			})
			.then(null, function(err) {
				return next(err);
			});
	});

