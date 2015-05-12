var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	eventSourceTemplateDao = require('../../persistence/eventSourceTemplateDao'),
	organizationDao = require('../../persistence/organizationDao'),
	eventSourceTemplateConverter = require('../../converters/eventSourceTemplateConverter'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/eventSourceTemplates');

module.exports = function (app) {
  app.use(resourceService.basePath, router);
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
			promise = eventSourceTemplateDao.findByOrganization(req.organization);
		}
		else if (req.query.allOrganizations != undefined || req.query.allOrganizations) {
			promise = eventSourceTemplateDao.findAllByUser(req.userModel);
		}
		else {
			promise = eventSourceTemplateDao.findAllPublic();
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
						console.log(err);
						return next(err)
					});
			})
			.catch(organizationDao.model.NotFoundError, function(err) {
				return resourceService.validationError(res, { organizationId: [ 'No organization found.' ] }).end();
			});
	});

router.route('/:id')
	.get(function(req, res, next) {
		return eventSourceTemplateDao
			.findByIdAndUser(req.params.id, req.userModel)
			.then(function(eventSourceTemplate) {
				return resourceService.ok(res, eventSourceTemplateConverter.convert(eventSourceTemplate));
			})
			.catch(eventSourceTemplateDao.model.NotFoundError, function(err) {
				return resourceService.forbidden(res).end();
			});
	});
