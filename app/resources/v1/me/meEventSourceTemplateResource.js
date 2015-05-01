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

	.patch(function(req, res, next) {
		var eventSourceTemplate = req.eventSourceTemplate;

		var data = req.body;

		if (data.name !== undefined) {
			eventSourceTemplate.set('name', data.name);
		}

		if (data.public !== undefined) {
			eventSourceTemplate.set('public', data.public);
		}

		if (data.configuration !== undefined) {
			if (data.configuration.schema !== undefined) {
				eventSourceTemplate.configurationSchema = data.configuration.schema;
			}

			if (data.configuration.callbackUrl !== undefined) {
				eventSourceTemplate.callbackUrl = data.configuration.callbackUrl;
			}

			if (data.configuration.callbackToken !== undefined) {
				eventSourceTemplate.callbackToken = data.configuration.callbackToken;
			}
		}

		if (eventSourceTemplate.hasChanged()) {
			return eventSourceTemplateDao
				.save(eventSourceTemplate)
				.then(function() {
					return resourceService.location(res, 201, eventSourceTemplate).end();
				})
				.catch(ValidationError, function(e) {
					return resourceService.validationError(res, e);
				});
		}
		else {
			return resourceService.location(res, 304, eventSourceTemplate, req.organization.get('id') + '/templates/eventSources').end();
		}
	});