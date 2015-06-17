var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	Connector = require('../../../lib/ioc').create('connector'),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	eventSourceTemplateDao = require('../../persistence/eventSourceTemplateDao'),
	eventSourceInstanceDao = require('../../persistence/eventSourceInstanceDao'),
	organizationDao = require('../../persistence/organizationDao'),
	eventSourceInstanceConverter = require('../../converters/eventSourceInstanceConverter'),
	jsonValidatorService = require('../../services/jsonValidatorService'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/eventSourceInstances');

module.exports = function (app) {
  app.use(resourceService.basePath, router);

	router.param('id', function (req, res, next) {
		return eventSourceInstanceDao
			.findByIdAndUser(req.params.id, req.userModel)
			.then(function(eventSourceInstance) {
				req.eventSourceInstance = eventSourceInstance;
				next();
			})
			.catch(eventSourceInstanceDao.model.NotFoundError, function(err) {
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

		if (req.eventSourceTemplate) {
			promise = eventSourceInstanceDao.findByEventSourceTemplateAndUser(req.eventSourceTemplate, req.userModel, { name: req.query.name });
		}

		else if (req.organization) {
			promise = eventSourceInstanceDao.findByOrganization(req.organization, { name: req.query.name });
		}

		else if (req.query.allOrganizations != undefined || req.query.allOrganizations) {
			promise = eventSourceInstanceDao.findAllByUser(req.userModel, { name: req.query.name });
		}

		if (promise) {
			return promise.then(function (eventSourceInstances) {
				return resourceService.ok(res,
					_.map(eventSourceInstances, function (eventSourceInstance) {
						return eventSourceInstanceConverter.convert(eventSourceInstance);
					})
				);
			});
		}
		else {
			return resourceService.validationError(res, {
				eventSourceTemplateId: [ 'Event source template id should be provided.' ],
				organizationId: [ 'Organization id should be provided.' ],
				allOrganizations: [ 'allOrganizations should be provided.' ]
			}).end();
		}
	})

	.post(function(req, res, next) {
		var eventSourceInstance = req.body;

		// Try to find the organization
		organizationDao
			.findByIdAndUser(eventSourceInstance.organizationId, req.userModel)
			.then(function(organization) {
				// Try to find the event source template
				return eventSourceTemplateDao
					.findByIdAndUserOrPublic(eventSourceInstance.eventSourceTemplateId, req.userModel)
					.then(function(eventSourceTemplate) {
						// Prepare the creation function
						var create = function() {
							if (!eventSourceTemplate.get('public') && eventSourceInstance.organizationId != eventSourceTemplate.get('organization_id')) {
								return resourceService.validationError(res, { eventSourceTemplateId: [ 'No event source template found.' ] }).end();
							}

							else {
								return eventSourceInstanceDao
									.createAndSave(eventSourceInstance, organization, eventSourceTemplate)
									.then(function(eventSourceInstanceSaved) {
										return new Connector()
											.configureEventSourceInstance(eventSourceTemplate, eventSourceInstanceSaved)
											.then(function() { return eventSourceInstanceSaved; })
											.catch(function(err) {
												return resourceService.serverError(res, { message: 'Unable to configure the remote event source.'})
											});
									})
									.then(function(eventSourceInstanceSaved) {
										return resourceService.location(res, 201, eventSourceInstanceSaved).end();
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
						if (eventSourceTemplate.get('configurationSchema')) {
							return jsonValidatorService
								.validate(eventSourceInstance, 'configuration', eventSourceTemplate.get('configurationSchema'))
								.then(create)
								.catch(ValidationError, function(err) {
									return resourceService.validationError(res, err).end();
								});
						}
						else {
							return create();
						}
					})
					.catch(eventSourceTemplateDao.model.NotFoundError, function(err) {
						return resourceService.validationError(res, { eventSourceTemplateId: [ 'No event source template found.' ] }).end();
					});
			})
			.catch(organizationDao.model.NotFoundError, function(err) {
				return resourceService.validationError(res, { organizationId: [ 'No organization found.' ] }).end();
			});
	});

router.route('/:id')
	.get(function(req, res, next) {
		return resourceService.ok(res, eventSourceInstanceConverter.convert(req.eventSourceInstance));;
	})

	.patch(function(req, res, next) {
		var eventSourceInstance = req.eventSourceInstance;

		var data = req.body;

		if (data.name !== undefined) {
			eventSourceInstance.set('name', data.name);
		}

		if (data.configuration !== undefined) {
			eventSourceInstance.configuration = data.configuration;
		}

		if (eventSourceInstance.hasChanged()) {
			return eventSourceInstanceDao
				.save(eventSourceInstance)
				.then(eventSourceInstance.eventSourceTemplate().fetch())
				.then(function(eventSourceTemplate) {
					return new Connector()
						.configureEventSourceInstance(eventSourceTemplate, eventSourceInstance)
						.then(function() { return eventSourceInstance; })
						.catch(function(err) {
							return resourceService.serverError(res, { message: 'Unable to configure the remote event source.'})
						});
				})
				.then(function() {
					return resourceService.location(res, 201, eventSourceInstance).end();
				})
				.catch(ValidationError, function(e) {
					return resourceService.validationError(res, e);
				});
		}
		else {
			return resourceService.location(res, 304, eventSourceInstance).end();
		}
	});
