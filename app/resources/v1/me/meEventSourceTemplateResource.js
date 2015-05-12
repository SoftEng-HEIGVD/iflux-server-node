var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	ValidationError = require('checkit').Error,
	models = require('../../../models/models'),
	eventSourceTemplateConverter = require('../../../converters/eventSourceTemplateConverter'),
	eventSourceTemplateDao = require('../../../persistence/eventSourceTemplateDao'),
	resourceService = require('../../../services/resourceServiceFactory')('/v1/me/organizations');

module.exports = function (app) {
  app.use(resourceService.basePath, router);

	app.param('estId', function(req, res, next) {
		return eventSourceTemplateDao
			.findById(req.params.estId)
			.then(function(eventSourceTemplate) {
				req.eventSourceTemplate = eventSourceTemplate;
				next();
			})
			.catch(eventSourceTemplateDao.model.NotFoundError, function(err) {
				return resourceService.notFound(res, 'Event source template not found.');
			});
	});
};

router.route('/templates/eventSources')
	.get(function(req, res, next) {
		return eventSourceTemplateDao
			.findAllForUser(req.userModel)
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

router.route('/:orgId/templates/eventSources')
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

router.route('/:orgId/templates/eventSources/:estId')
	.get(function(req, res, next) {
		return resourceService.ok(res, eventSourceTemplateConverter.convert(req.eventSourceTemplate));
	})

;