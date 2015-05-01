var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	ValidationError = require('checkit').Error,
	models = require('../../../models/models'),
	eventSourceTemplateDao = require('../../../persistence/eventSourceTemplateDao'),
	eventSourceTemplateConverter = require('../../../converters/eventSourceTemplateConverter'),
	resourceService = require('../../../services/resourceServiceFactory')('/v1/templates/eventSources');

module.exports = function (app) {
  app.use(resourceService.basePath, router);
};

router.route('/')
	.get(function(req, res, next) {
		eventSourceTemplateDao
			.findAllPublic()
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

router.route('/:id')
	.get(function(req, res, next) {
		return eventSourceTemplateDao
			.findById(req.params.id)
			.then(function(eventSourceTemplate) {
				if (eventSourceTemplate) {
					return resourceService.ok(res, eventSourceTemplateConverter.convert(eventSourceTemplate));
				}
				else {
					return resourceService.notFound(res);
				}
			})
			.catch(eventSourceTemplateDao.model.NotFoundError, function(err) {
				return resourceService.notFound(res);
			});
	});
