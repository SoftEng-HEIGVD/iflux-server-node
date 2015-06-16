var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	npmlog = require('npmlog'),
	ValidationError = require('checkit').Error,
	Connector = require('../../../lib/ioc').create('connector'),
	models = require('../../models/models'),
	actionTargetTemplateDao = require('../../persistence/actionTargetTemplateDao'),
	actionTargetInstanceDao = require('../../persistence/actionTargetInstanceDao'),
	organizationDao = require('../../persistence/organizationDao'),
	actionTargetInstanceConverter = require('../../converters/actionTargetInstanceConverter'),
	jsonValidatorService = require('../../services/jsonValidatorService'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/actionTargetInstances');

module.exports = function (app) {
  app.use(resourceService.basePath, router);

	router.param('id', function (req, res, next) {
		return actionTargetInstanceDao
			.findByIdAndUser(req.params.id, req.userModel)
			.then(function(actionTargetInstance) {
				req.actionTargetInstance = actionTargetInstance;
				next();
			})
			.catch(actionTargetInstanceDao.model.NotFoundError, function(err) {
				return resourceService.forbidden(res).end();
			});
	});
};

router.route('/')
	.get(function(req, res, next) {
		if (req.query.actionTargetTemplateId) {
			return actionTargetTemplateDao
				.findByIdAndUser(req.query.actionTargetTemplateId, req.userModel)
				.then(function(actionTargetTemplate) {
					req.actionTargetTemplate = actionTargetTemplate;
					return next();
				})
				.catch(actionTargetTemplateDao.model.NotFoundError, function(err) {
					return resourceService.forbidden(res).end();
				});
		}
		else if (req.query.organizationId) {
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

		if (req.actionTargetTemplate) {
			promise = actionTargetInstanceDao.findByActionTargetTemplateAndUser(req.actionTargetTemplate, req.userModel, { name: req.query.name });
		}

		else if (req.organization) {
			promise = actionTargetInstanceDao.findByOrganization(req.organization, { name: req.query.name });
		}

		else if (req.query.allOrganizations != undefined || req.query.allOrganizations) {
			promise = actionTargetInstanceDao.findAllByUser(req.userModel, { name: req.query.name });
		}

		if (promise) {
			return promise.then(function (actionTargetInstances) {
				return resourceService.ok(res,
					_.map(actionTargetInstances, function (actionTargetInstance) {
						return actionTargetInstanceConverter.convert(actionTargetInstance);
					})
				);
			});
		}
		else {
			return resourceService.validationError(res, {
				actionTargetTemplateId: [ 'Action target template id should be provided.' ],
				organizationId: [ 'Organization id should be provided.' ],
				allOrganizations: [ 'allOrganizations should be provided.' ]
			}).end();
		}
	})

	.post(function(req, res, next) {
		var actionTargetInstance = req.body;

		// Try to find the organization
		organizationDao
			.findByIdAndUser(actionTargetInstance.organizationId, req.userModel)
			.then(function(organization) {
				// Try to find the action target template
				return actionTargetTemplateDao
					.findByIdAndUserOrPublic(actionTargetInstance.actionTargetTemplateId, req.userModel)
					.then(function(actionTargetTemplate) {
						// Prepare the creation function
						var create = function() {
							if (!actionTargetTemplate.get('public') && actionTargetInstance.organizationId != actionTargetTemplate.get('organization_id')) {
								return resourceService.validationError(res, { actionTargetTemplateId: [ 'No action target template found.' ] }).end();
							}

							else {
								return actionTargetInstanceDao
									.createAndSave(actionTargetInstance, organization, actionTargetTemplate)
									.then(function(actionTargetInstanceSaved) {
										return new Connector()
											.configureActionTargetInstance(actionTargetTemplate, actionTargetInstanceSaved)
											.then(function() { return actionTargetInstanceSaved; });
									})
									.then(function(actionTargetInstanceSaved) {
										return resourceService.location(res, 201, actionTargetInstanceSaved).end();
									})
									.catch(ValidationError, function(e) {
										return resourceService.validationError(res, e).end();
									})
									.catch(function(err) {
										npmlog.error(err);
										return next(err)
									});
							}
						};

						// Check if a validation must be done for the configuration and do it
						if (actionTargetTemplate.get('configurationSchema')) {
							return jsonValidatorService
								.validate(actionTargetInstance, 'configuration', actionTargetTemplate.get('configurationSchema'))
								.then(create)
								.catch(ValidationError, function(err) {
									return resourceService.validationError(res, err).end();
								});
						}
						else {
							return create();
						}
					})
					.catch(actionTargetTemplateDao.model.NotFoundError, function(err) {
						return resourceService.validationError(res, { actionTargetTemplateId: [ 'No action target template found.' ] }).end();
					});
			})
			.catch(organizationDao.model.NotFoundError, function(err) {
				return resourceService.validationError(res, { organizationId: [ 'No organization found.' ] }).end();
			});
	});

router.route('/:id')
	.get(function(req, res, next) {
		return resourceService.ok(res, actionTargetInstanceConverter.convert(req.actionTargetInstance));;
	})

	.patch(function(req, res, next) {
		var actionTargetInstance = req.actionTargetInstance;

		var data = req.body;

		if (data.name !== undefined) {
			actionTargetInstance.set('name', data.name);
		}

		if (data.configuration !== undefined) {
			actionTargetInstance.configuration = data.configuration;
		}

		if (actionTargetInstance.hasChanged()) {
			return actionTargetInstanceDao
				.save(actionTargetInstance)
				.then(actionTargetInstance.actionTargetTemplate().fetch())
				.then(function(actionTargetTemplate) {
					return new Connector()
						.configureActionTargetInstance(actionTargetTemplate, actionTargetInstance)
						.then(function() { return actionTargetInstance; });
				})
				.then(function() {
					return resourceService.location(res, 201, actionTargetInstance).end();
				})
				.catch(ValidationError, function(e) {
					return resourceService.validationError(res, e);
				});
		}
		else {
			return resourceService.location(res, 304, actionTargetInstance).end();
		}
	});
