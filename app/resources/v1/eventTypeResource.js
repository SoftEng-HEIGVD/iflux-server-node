var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	eventSourceTemplateDao = require('../../persistence/eventSourceTemplateDao'),
	eventTypeDao = require('../../persistence/eventTypeDao'),
	eventTypeConverter = require('../../converters/eventTypeConverter'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/eventSourceTemplates/:estId/eventTypes');

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
	});