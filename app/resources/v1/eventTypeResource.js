var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	npmlog = require('npmlog'),
	validUrl = require('valid-url'),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	eventSourceTemplateDao = require('../../persistence/eventSourceTemplateDao'),
	eventTypeDao = require('../../persistence/eventTypeDao'),
	eventTypeConverter = require('../../converters/eventTypeConverter'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/eventTypes');

module.exports = function (app) {
  app.use(resourceService.basePath, router);

	router.param('id', function (req, res, next) {
		return eventTypeDao
			.findByIdAndUser(req.params.id, req.userModel)
			.then(function(eventType) {
				req.eventType = eventType;
				next();
			})
			.catch(eventTypeDao.model.NotFoundError, function(err) {
				return resourceService.forbidden(res).end();
			});
	});
};

router.route('/')
	.get(function(req, res, next) {
		if (req.query.eventSourceTemplateId) {
			return eventSourceTemplateDao
				.findByIdAndUser(req.query.eventSourceTemplateId, req.userModel)
				.then(function(eventSourceTemplate) {
					req.eventSourceTemplate = eventSourceTemplate;
					return next();
				})
				.catch(eventSourceTemplateDao.model.NotFoundError, function(err) {
					return resourceService.forbidden(res).end();
				});
		}
		else {
			return resourceService.validationError(res, { eventSourceTemplateId: [ 'The event source template id is mandatory' ]}).end();;
		}
	})
	.get(function(req, res, next) {
		return eventTypeDao
			.findByEventSourceTemplate(req.eventSourceTemplate, { name: req.query.name })
			.then(function (eventTypes) {
				return resourceService.ok(res,
					_.map(eventTypes, function (eventType) {
						return eventTypeConverter.convert(eventType);
					})
				);
			});
	})

	.post(function(req, res, next) {
		if (!req.body.type) {
			return resourceService.validationError(res, { type: [ 'Type is mandatory.' ] }).end();
		}
		else {
			var url = validUrl.is_web_uri(req.body.type);

			if (!url) {
				return resourceService.validationError(res, { type: [ 'Type must be a valid URL.' ] }).end();
			}
		}

		return next();
	})
	.post(function(req, res, next) {
		var eventType = req.body;

		eventTypeDao
			.findByType(eventType.type)
			.then(function(eventTypeFound) {
				if (eventTypeFound) {
					return resourceService.validationError(res, { type: [ 'Type must be unique.' ] }).end();
				}
				else {
					return eventSourceTemplateDao.
						findByIdAndUser(eventType.eventSourceTemplateId, req.userModel)
						.then(function(eventSourceTemplate) {
							eventTypeDao
								.createAndSave(eventType, eventSourceTemplate)
								.then(function(eventSourceTemplateSaved) {
									return resourceService.location(res, 201, eventSourceTemplateSaved).end();
								})
								.catch(ValidationError, function(e) {
									return resourceService.validationError(res, e).end();
								})
								.catch(function(err) {
									npmlog.error(err);
									return next(err)
								});
						})
						.catch(eventSourceTemplateDao.model.NotFoundError, function(err) {
							return resourceService.validationError(res, { eventSourceTemplateId: [ 'No event source template found.' ] }).end();
						});
				}
			});
	});

router.route('/:id')
	.get(function(req, res, next) {
		return resourceService.ok(res, eventTypeConverter.convert(req.eventType));;
	})

	.patch(function(req, res, next) {
		if (req.body.type) {
			var url = validUrl.is_web_uri(req.body.type);

			if (!url) {
				return resourceService.validationError(res, { type: [ 'Type must be a valid URL.' ] }).end();
			}
			else {
				if (req.body.type == req.eventType.get('type')) {
					delete req.body.type;
					return next();
				}
				else {
					return eventTypeDao
						.findByType(req.body.type)
						.then(function(eventTypeFound) {
							if (eventTypeFound) {
								return resourceService.validationError(res, {type: ['Type must be unique.']}).end();
							}
							else {
								return next();
							}
						});
				}
			}
		}
		else {
			return next();
		}
	})
	.patch(function(req, res, next) {
		var eventType = req.eventType;

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

		if (data.type !== undefined) {
			eventType.set('type', data.type);
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
	});