var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	npmlog = require('npmlog'),
	validUrl = require('valid-url'),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	actionTypeDao = require('../../persistence/actionTypeDao'),
	organizationDao = require('../../persistence/organizationDao'),
	actionTypeConverter = require('../../converters/actionTypeConverter'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/actionTypes');

module.exports = function (app) {
  app.use(resourceService.basePath, router);

	router.param('id', function (req, res, next) {
		return actionTypeDao
			.findByIdAndUser(req.params.id, req.userModel)
			.then(function(actionType) {
				req.actionType = actionType;
				return next();
			})
			.catch(actionTypeDao.model.NotFoundError, function(err) {
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
			promise = actionTypeDao.findByOrganization(req.organization, { name: req.query.name });
		}
		else if (req.query.allOrganizations != undefined || req.query.allOrganizations) {
			promise = actionTypeDao.findAllByUser(req.userModel, { name: req.query.name });
		}
		else {
			promise = actionTypeDao.findAllPublic({ name: req.query.name });
		}

		return promise
			.then(function (actionTypes) {
				return resourceService.ok(res,
					_.map(actionTypes, function (actionType) {
						return actionTypeConverter.convert(actionType);
					})
				);
			});
	})

	.post(function(req, res, next) {
		if (!req.body.type) {
			return resourceService.validationError(res, { type: [ 'Type is mandatory.' ] }).end();
		}
		else {
			var url = validUrl.is_web_uri(req.body.type);

			if (!url) {
				return resourceService.validationError(res, { type: [ 'Type must be a valid URL.' ] }).end();
			}
		}

		return next();
	})
	.post(function(req, res, next) {
		var actionType = req.body;

		return organizationDao
			.findByIdAndUser(actionType.organizationId, req.userModel)
			.then(function(organization) {
				return actionTypeDao
					.findByType(actionType.type)
					.then(function(actionTypeFound) {
						if (actionTypeFound) {
							return resourceService.validationError(res, {type: ['Type must be unique.']}).end();
						}
						else {
							actionTypeDao
								.createAndSave(actionType, organization)
								.then(function (actionTargetTemplateSaved) {
									return resourceService.location(res, 201, actionTargetTemplateSaved).end();
								})
								.catch(ValidationError, function (e) {
									return resourceService.validationError(res, e).end();
								})
								.catch(function (err) {
									npmlog.error(err);
									return next(err)
								});
						}
					});
			})
			.catch(organizationDao.model.NotFoundError, function(err) {
				return resourceService.validationError(res, { organizationId: [ 'No organization found.' ] }).end();
			});
	});

router.route('/:id')
	.get(function(req, res, next) {
		return resourceService.ok(res, actionTypeConverter.convert(req.actionType));
	})

	.patch(function(req, res, next) {
		if (req.body.type) {
			var url = validUrl.is_web_uri(req.body.type);

			if (!url) {
				return resourceService.validationError(res, { type: [ 'Type must be a valid URL.' ] }).end();
			}
			else {
				if (req.body.type == req.actionType.get('type')) {
					delete req.body.type;
					return next();
				}
				else {
					return actionTypeDao
						.findByType(req.body.type)
						.then(function(actionTypeFound) {
							if (actionTypeFound) {
								return resourceService.validationError(res, {type: ['Type must be unique.']}).end();
							}
							else {
								return next();
							}
						});
				}
			}
		}
		else {
			return next();
		}
	})
	.patch(function(req, res, next) {
		var actionType = req.actionType;

		var data = req.body;

		if (data.name !== undefined) {
			actionType.set('name', data.name);
		}

		if (data.description !== undefined) {
			actionType.set('description', data.description);
		}

		if (data.public !== undefined) {
			actionType.set('public', data.public);
		}

		if (data.schema !== undefined) {
			actionType.set('actionTypeSchema', data.schema);
		}

		if (data.type !== undefined) {
			actionType.set('type', data.type);
		}

		if (actionType.hasChanged()) {
			return actionTypeDao
				.save(actionType)
				.then(function() {
					return resourceService.location(res, 201, actionType).end();
				})
				.catch(ValidationError, function(e) {
					return resourceService.validationError(res, e).end();
				});
		}
		else {
			return resourceService.location(res, 304, actionType).end();
		}
	});