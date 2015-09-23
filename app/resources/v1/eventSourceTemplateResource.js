var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	npmlog = require('npmlog'),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	eventSourceTemplateDao = require('../../persistence/eventSourceTemplateDao'),
	organizationDao = require('../../persistence/organizationDao'),
	eventSourceTemplateConverter = require('../../converters/eventSourceTemplateConverter'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/eventSourceTemplates');

module.exports = function (app) {
  app.use(resourceService.basePath, router);

	router.param('id', function (req, res, next) {
    var promise;
      if (req.method == 'GET') {
        promise = eventSourceTemplateDao.findByIdAndUserOrPublic(req.params.id, req.userModel);
      }
      else {
        promise = eventSourceTemplateDao.findByIdAndUser(req.params.id, req.userModel);
      }

    return promise
			.then(function(eventSourceTemplate) {
				req.eventSourceTemplate = eventSourceTemplate;
				next();
			})
			.catch(eventSourceTemplateDao.model.NotFoundError, function(err) {
				return resourceService.forbidden(res).end();
			});
	});
};

router.route('/')
	.get(function(req, res, next) {
		if (req.query.organizationId) {
			return organizationDao
				.findByIdAndUser(req.query.organizationId, req.userModel)
				.then(function(organization) {
					req.organization = organization;
					return next();
				})
				.catch(organizationDao.model.NotFoundError, function(err) {
					return resourceService.forbidden(res).end();
				});
		}
		else {
			return next();
		}
	})
	.get(function(req, res, next) {
		var promise = null;

		if (req.organization) {
			promise = eventSourceTemplateDao.findByOrganization(req.organization, { name: req.query.name });
		}
		else if (req.query.allOrganizations != undefined || req.query.allOrganizations) {
			promise = eventSourceTemplateDao.findAllByUser(req.userModel, { name: req.query.name });
		}
		else if (req.query.public != undefined || req.query.public) {
			promise = eventSourceTemplateDao.findAllPublic({ name: req.query.name });
		}
		else {
			promise = eventSourceTemplateDao.findAllAccessible(req.userModel, { name: req.query.name });
		}

		return promise.then(function(eventSourceTemplates) {
			return resourceService.ok(res,
				_.map(eventSourceTemplates, function(eventSourceTemplate) {
					return eventSourceTemplateConverter.convert(eventSourceTemplate);
				})
			);
		});
	})

	.post(function(req, res, next) {
		var eventSourceTemplate = req.body;

		organizationDao.
			findByIdAndUser(eventSourceTemplate.organizationId, req.userModel)
			.then(function(organization) {
				eventSourceTemplateDao
					.createAndSave(eventSourceTemplate, organization)
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
			.catch(organizationDao.model.NotFoundError, function(err) {
				return resourceService.validationError(res, { organizationId: [ 'No organization found.' ] }).end();
			});
	});


router.route('/:id')
	.get(function(req, res, next) {
		return resourceService.ok(res, eventSourceTemplateConverter.convert(req.eventSourceTemplate));;
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
				eventSourceTemplate.set('configurationSchema', data.configuration.schema);
			}

			if (data.configuration.url !== undefined) {
				eventSourceTemplate.set('configurationUrl', data.configuration.url);
			}

			if (data.configuration.token !== undefined) {
				eventSourceTemplate.set('configurationToken', data.configuration.token);
			}
		}

		if (data.configurationUi !== undefined) {
			eventSourceTemplate.set('configurationUi', data.configurationUi);
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

  .delete(function(req, res, next) {
    return resourceService.manageDelete(res, req.eventSourceTemplate, 'event source template', _.bind(eventSourceTemplateDao.countReferences, eventSourceTemplateDao));
  });
