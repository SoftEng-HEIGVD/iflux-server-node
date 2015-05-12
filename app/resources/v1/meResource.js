var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	organizationConverter = require('../../converters/organizationConverter'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/me');

module.exports = function (app) {
  app.use(resourceService.basePath, router);
};

router.route('/organizations')
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
