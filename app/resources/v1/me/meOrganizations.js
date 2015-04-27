var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	ValidationError = require('checkit').Error,
	models = require('../../../models/models'),
	organizationConverter = require('../../../converters/organizationConverter'),
	eventSourceTemplateConverter = require('../../../converters/eventSourceTemplateConverter'),
	eventSourceTemplateDao = require('../../../persistence/eventSourceTemplateDao'),
	organizationDao = require('../../../persistence/organizationDao'),
	resourceService = require('../../../services/resourceServiceFactory')('/v1/me/organizations');

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

router.route('/:id/templates/eventSources')
	.get(function(req, res, next) {
		return organizationDao
			.findById(req.params.id)
			.then(function(organization) {
				req.organization = organization;
				return next();
			})
			.catch(organizationDao.model.NotFoundError, function(err) {
				return resourceService.notFound(res);
			});
	});

router.route('/:id/templates/eventSources')
	.get(function(req, res, next) {
		return eventSourceTemplateDao
			.findByOrganizationId(req.organization.get('id'))
			.then(function(eventSourceTemplates) {
				return resourceService.ok(res,
					_.map(eventSourceTemplates, function(eventSourceTemplate) {
						return eventSourceTemplateConverter.convert(eventSourceTemplate);
					})
				);
			})
			.then(null, function(err) {
				return next(err);
			});
	});
