var
	_ = require('underscore'),
	Promise = require('bluebird'),
	express = require('express'),
  router = express.Router(),
	ValidationError = require('checkit').Error,
	Connector = require('../../../lib/ioc').create('connector'),
	models = require('../../models/models'),
	actionTargetTemplateDao = require('../../persistence/actionTargetTemplateDao'),
	actionTargetDao = require('../../persistence/actionTargetDao'),
	organizationDao = require('../../persistence/organizationDao'),
	actionTargetConverter = require('../../converters/actionTargetConverter'),
	jsonValidatorService = require('../../services/jsonValidatorService'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/actionTargets');

var connector = new Connector();

module.exports = function (app) {
  app.use(resourceService.basePath, router);

	router.param('id', function (req, res, next) {
		return actionTargetDao
			.findByIdAndUser(req.params.id, req.userModel)
			.then(function(actionTarget) {
				req.actionTarget = actionTarget;
				next();
			})
			.catch(actionTargetDao.model.NotFoundError, function(err) {
				return resourceService.forbidden(res).end();
			});
	});
};

router.route('/')
	.get(function(req, res, next) {
		if (req.query.actionTargetTemplateId) {
			return actionTargetTemplateDao
				.findByIdAndUserOrPublic(req.query.actionTargetTemplateId, req.userModel)
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
			promise = actionTargetDao.findByActionTargetTemplateAndUser(req.actionTargetTemplate, req.userModel, { name: req.query.name });
		}

		else if (req.organization) {
			promise = actionTargetDao.findByOrganization(req.organization, { name: req.query.name });
		}

		else if (req.query.allOrganizations != undefined || req.query.allOrganizations) {
			promise = actionTargetDao.findAllByUser(req.userModel, { name: req.query.name });
		}

		if (promise) {
			return promise.then(function (actionTargets) {
				return resourceService.ok(res,
					_.map(actionTargets, function (actionTarget) {
						return actionTargetConverter.convert(actionTarget);
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
		var actionTarget = req.body;

		// Try to find the organization
		organizationDao
			.findByIdAndUser(actionTarget.organizationId, req.userModel)
			.then(function(organization) {
				// Try to find the action target template
				return actionTargetTemplateDao
					.findByIdAndUserOrPublic(actionTarget.actionTargetTemplateId, req.userModel)
					.then(function(actionTargetTemplate) {
						// Prepare the creation function
						var create = function() {
							if (!actionTargetTemplate.get('public') && actionTarget.organizationId != actionTargetTemplate.get('organization_id')) {
								return resourceService.validationError(res, { actionTargetTemplateId: [ 'No action target template found.' ] }).end();
							}

							else {
								return actionTargetDao
									.createAndSave(actionTarget, organization, actionTargetTemplate)
									.then(function(actionTargetSaved) {
										return connector
											.configureActionTarget(actionTargetTemplate, actionTargetSaved)
											.then(function() { return actionTargetSaved; })
											.catch(function(err) {
												return resourceService.serverError(res, { message: 'Unable to configure the remote action target.'})
											});
									})
									.then(function(actionTargetSaved) {
										return resourceService.location(res, 201, actionTargetSaved).end();
									})
									.catch(ValidationError, function(e) {
										return resourceService.validationError(res, e).end();
									})
									.catch(function(err) {
										console.log(err);
										return next(err)
									});
							}
						};

						// Check if a validation must be done for the configuration and do it
						if (actionTargetTemplate.get('configurationSchema')) {
							return jsonValidatorService
								.validate(actionTarget, 'configuration', actionTargetTemplate.get('configurationSchema'))
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
		return resourceService.ok(res, actionTargetConverter.convert(req.actionTarget));;
	})

	.patch(function(req, res, next) {
		var actionTarget = req.actionTarget;

		var data = req.body;

		if (data.name !== undefined) {
			actionTarget.set('name', data.name);
		}

		if (data.configuration !== undefined) {
			actionTarget.set('configuration', data.configuration);
		}

		if (actionTarget.hasChanged()) {
			return actionTargetDao
				.save(actionTarget)
				.then(function() { return actionTarget.actionTargetTemplate().fetch(); })
				.then(function(actionTargetTemplate) {
					return connector
						.configureActionTarget(actionTargetTemplate, actionTarget)
						.catch(function(err) {
							return resourceService.serverError(res, { message: 'Unable to configure the remote action target.'})
						});
				})
				.then(function() {
					return resourceService.location(res, 201, actionTarget).end();
				})
				.catch(ValidationError, function(e) {
					return resourceService.validationError(res, e);
				});
		}
		else {
			return resourceService.location(res, 304, actionTarget).end();
		}
	});

router.route('/:id/configure')
	.post(function(req, res, next) {
		var actionTarget = req.actionTarget;

		return Promise
			.resolve(actionTarget.actionTargetTemplate().fetch())
			.then(function(actionTargetTemplate) {
				if (actionTargetTemplate.get('configurationUrl')) {
					return connector
						.configureActionTarget(actionTargetTemplate, actionTarget)
						.then(function () {
							resourceService.ok(res).end();
						})
						.catch(function (err) {
							return resourceService.serverError(res, {message: 'Unable to configure the remote action target.'})
						});
				}
				else {
					return resourceService.notFound(res);
				}
			});
	});

