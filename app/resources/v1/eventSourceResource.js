var
	_ = require('underscore'),
	Promise = require('bluebird'),
	express = require('express'),
  router = express.Router(),
	Connector = require('../../../lib/ioc').create('connector'),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	eventSourceTemplateDao = require('../../persistence/eventSourceTemplateDao'),
	eventSourceDao = require('../../persistence/eventSourceDao'),
	organizationDao = require('../../persistence/organizationDao'),
	eventSourceConverter = require('../../converters/eventSourceConverter'),
	jsonValidatorService = require('../../services/jsonValidatorService'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/eventSources');

var connector = new Connector();

module.exports = function (app) {
  app.use(resourceService.basePath, router);

	router.param('id', function (req, res, next) {
		return eventSourceDao
			.findByIdAndUser(req.params.id, req.userModel)
			.then(function(eventSource) {
				req.eventSource = eventSource;
				next();
			})
			.catch(eventSourceDao.model.NotFoundError, function(err) {
				return resourceService.forbidden(res).end();
			});
	});
};

router.route('/')
	.get(function(req, res, next) {
		if (req.query.eventSourceTemplateId) {
			return eventSourceTemplateDao
				.findByIdAndUserOrPublic(req.query.eventSourceTemplateId, req.userModel)
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
			promise = eventSourceDao.findByEventSourceTemplateAndUser(req.eventSourceTemplate, req.userModel, { name: req.query.name });
		}

		else if (req.organization) {
			promise = eventSourceDao.findByOrganization(req.organization, { name: req.query.name });
		}

		else if (req.query.allOrganizations != undefined || req.query.allOrganizations) {
			promise = eventSourceDao.findAllByUser(req.userModel, { name: req.query.name });
		}

		if (promise) {
			return promise.then(function (eventSources) {
				return resourceService.ok(res,
					_.map(eventSources, function (eventSource) {
						return eventSourceConverter.convert(eventSource);
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
		var eventSource = req.body;

		// Try to find the organization
		organizationDao
			.findByIdAndUser(eventSource.organizationId, req.userModel)
			.then(function(organization) {
				// Try to find the event source template
				return eventSourceTemplateDao
					.findByIdAndUserOrPublic(eventSource.eventSourceTemplateId, req.userModel)
					.then(function(eventSourceTemplate) {
						// Prepare the creation function
						var create = function() {
							if (!eventSourceTemplate.get('public') && eventSource.organizationId != eventSourceTemplate.get('organization_id')) {
								return resourceService.validationError(res, { eventSourceTemplateId: [ 'No event source template found.' ] }).end();
							}

							else {
								return eventSourceDao
									.createAndSave(eventSource, organization, eventSourceTemplate)
									.then(function(eventSourceSaved) {
										return connector
											.configureEventSource(eventSourceTemplate, eventSourceSaved)
											.then(function() { return eventSourceSaved; })
											.catch(function(err) {
												return resourceService.serverError(res, { message: 'Unable to configure the remote event source.'})
											});
									})
									.then(function(eventSourceSaved) {
										return resourceService.location(res, 201, eventSourceSaved).end();
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
								.validate(eventSource, 'configuration', eventSourceTemplate.get('configurationSchema'))
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
		return resourceService.ok(res, eventSourceConverter.convert(req.eventSource));;
	})

	.patch(function(req, res, next) {
		var eventSource = req.eventSource;

		var data = req.body;

		if (data.name !== undefined) {
			eventSource.set('name', data.name);
		}

		if (data.configuration !== undefined) {
			eventSource.set('configuration', data.configuration);
		}

		if (eventSource.hasChanged()) {
			return eventSourceDao
				.save(eventSource)
				.then(function() { return eventSource.eventSourceTemplate().fetch(); })
				.then(function(eventSourceTemplate) {
					return connector
						.configureEventSource(eventSourceTemplate, eventSource)
						.catch(function(err) {
							return resourceService.serverError(res, { message: 'Unable to configure the remote event source.'})
						});
				})
				.then(function() {
					return resourceService.location(res, 201, eventSource).end();
				})
				.catch(ValidationError, function(e) {
					return resourceService.validationError(res, e);
				});
		}
		else {
			return resourceService.location(res, 304, eventSource).end();
		}
	});

router.route('/:id/configure')
	.post(function(req, res, next) {
		var eventSource = req.eventSource;

		return Promise
			.resolve(eventSource.eventSourceTemplate().fetch())
			.then(function(eventSourceTemplate) {
				if (eventSourceTemplate.get('configurationUrl')) {
					return connector
						.configureEventSource(eventSourceTemplate, eventSource)
						.then(function () {
							resourceService.ok(res).end();
						})
						.catch(function (err) {
							return resourceService.serverError(res, {message: 'Unable to configure the remote event source.'})
						});
				}
				else {
					return resourceService.notFound(res);
				}
			});
	});

