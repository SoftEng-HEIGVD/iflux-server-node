var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	ValidationError = require('checkit').Error,
	models = require('../../../models/models'),
	eventSourceTemplateDao = require('../../../persistence/eventSourceTemplateDao'),
	eventTypeDao = require('../../../persistence/eventTypeDao'),
	eventTypeConverter = require('../../../converters/eventTypeConverter'),
	resourceService = require('../../../services/resourceServiceFactory')('/v1/templates/organizations/:orgId/eventSources/:estId/eventTypes');

module.exports = function (app) {
  app.use(resourceService.basePath, router);
};

router.route('/')
	.get(function(req, res, next) {
		eventTypeDao
			.findAll()
			.then(function(eventTypes) {
				return resourceService.ok(res,
					_.map(eventTypes, function(eventType) {
						return eventTypeConverter.convert(eventType);
					})
				);
			})
			.then(null, function(err) {
				return next(err);
			});
	})

	.post(function(req, res, next) {
		var eventType = req.body;

		eventTypeDao
			.createAndSave(req.eventSourceTemplate, eventType)
			.then(function(eventTypeSaved) {
				return resourceService.location(res, 201, eventTypeSaved).end();
			})
			.catch(ValidationError, function(e) {
				return resourceService.validationError(res, e).end();
			})
			.catch(function(err) {
				console.log(err);
				return next(err)
			});
	});

router.route('/:id')
	.get(function(req, res, next) {
		return eventTypeDao
			.findById(req.params.id)
			.then(function(eventType) {
				if (eventType) {
					return resourceService.ok(res, eventTypeConverter.convert(eventType));
				}
				else {
					return resourceService.notFound(res);
				}
			})
			.catch(eventTypeDao.model.NotFoundError, function(err) {
				return resourceService.notFound(res);
			});
	})

	.patch(function(req, res, next) {
		eventTypeDao
			.findById(req.params.id)
			.then(function(eventType) {
				var data = req.body;

				if (data.name !== undefined) {
					eventType.set('name', data.name);
				}

				if (data.description !== undefined) {
					eventType.set('description', data.description);
				}

				if (data.schema !== undefined) {
					eventType.set('eventTypeSchema', data.schema);
				}

				if (eventType.hasChanged()) {
					return eventTypeDao
						.save(eventType)
						.then(function() {
							return resourceService.location(res, 201, eventType).end();
						})
						.catch(ValidationError, function(e) {
							return resourceService.validationError(res, e);
						});
				}
				else {
					return resourceService.location(res, 304, eventType).end();
				}
			})
			.then(null, function(err) {
				next(err);
			});
	});