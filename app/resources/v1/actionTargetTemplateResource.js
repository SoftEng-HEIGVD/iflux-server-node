var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	npmlog = require('npmlog'),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	actionTargetTemplateDao = require('../../persistence/actionTargetTemplateDao'),
	organizationDao = require('../../persistence/organizationDao'),
	actionTargetTemplateConverter = require('../../converters/actionTargetTemplateConverter'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/actionTargetTemplates');

module.exports = function (app) {
  app.use(resourceService.basePath, router);

	router.param('id', function (req, res, next) {
		return actionTargetTemplateDao
			.findByIdAndUser(req.params.id, req.userModel)
			.then(function(actionTargetTemplate) {
				req.actionTargetTemplate = actionTargetTemplate;
				next();
			})
			.catch(actionTargetTemplateDao.model.NotFoundError, function(err) {
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
			promise = actionTargetTemplateDao.findByOrganization(req.organization, { name: req.query.name });
		}
		else if (req.query.allOrganizations != undefined || req.query.allOrganizations) {
			promise = actionTargetTemplateDao.findAllByUser(req.userModel, { name: req.query.name });
		}
		else if (req.query.public != undefined || req.query.public) {
			promise = actionTargetTemplateDao.findAllPublic({ name: req.query.name });
		}
		else {
			promise = actionTargetTemplateDao.findAllAccessible(req.userModel, { name: req.query.name });
		}

		return promise.then(function(actionTargetTemplates) {
			return resourceService.ok(res,
				_.map(actionTargetTemplates, function(actionTargetTemplate) {
					return actionTargetTemplateConverter.convert(actionTargetTemplate);
				})
			);
		});
	})

	.post(function(req, res, next) {
		var actionTargetTemplate = req.body;

		organizationDao
			.findByIdAndUser(actionTargetTemplate.organizationId, req.userModel)
			.then(function(organization) {
				actionTargetTemplateDao
					.createAndSave(actionTargetTemplate, organization)
					.then(function(actionTargetTempltateSaved) {
						return resourceService.location(res, 201, actionTargetTempltateSaved).end();
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
		return resourceService.ok(res, actionTargetTemplateConverter.convert(req.actionTargetTemplate));;
	})

	.patch(function(req, res, next) {
		var actionTargetTemplate = req.actionTargetTemplate;

		var data = req.body;

		if (data.name !== undefined) {
			actionTargetTemplate.set('name', data.name);
		}

		if (data.public !== undefined) {
			actionTargetTemplate.set('public', data.public);
		}

		if (data.configuration !== undefined) {
			if (data.configuration.schema !== undefined) {
				actionTargetTemplate.set('configurationSchema', data.configuration.schema);
			}

			if (data.configuration.url !== undefined) {
				actionTargetTemplate.set('configurationUrl', data.configuration.url);
			}

			if (data.configuration.token !== undefined) {
				actionTargetTemplate.set('configurationToken', data.configuration.token);
			}
		}

		if (data.configurationUi !== undefined) {
			actionTargetTemplate.set('configurationUi', data.configurationUi);
		}

		if (data.target !== undefined) {
			if (data.target.url !== undefined) {
				actionTargetTemplate.set('targetUrl', data.target.url);
			}

			if (data.target.token !== undefined) {
				actionTargetTemplate.set('targetToken', data.target.token);
			}
		}

		if (actionTargetTemplate.hasChanged()) {
			return actionTargetTemplateDao
				.save(actionTargetTemplate)
				.then(function() {
					return resourceService.location(res, 201, actionTargetTemplate).end();
				})
				.catch(ValidationError, function(e) {
					return resourceService.validationError(res, e);
				});
		}
		else {
			return resourceService.location(res, 304, actionTargetTemplate).end();
		}
	});
