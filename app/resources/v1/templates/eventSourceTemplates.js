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
	})

	.post(function(req, res, next) {
		var eventSourceTemplate = req.body;

		eventSourceTemplateDao
			.createAndSave(req.userModel, eventSourceTemplate)
			.then(function(eventSourceTemplateSaved) {
				return resourceService.location(res, 201, eventSourceTemplateSaved).end();
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
	})

	.patch(function(req, res, next) {
		eventSourceTemplateDao
			.findById(req.params.id)
			.then(function(eventSourceTemplate) {
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
					return resourceService.location(res, 304, eventSourceTemplate).end();
				}
			})
			.then(null, function(err) {
				next(err);
			});
	});