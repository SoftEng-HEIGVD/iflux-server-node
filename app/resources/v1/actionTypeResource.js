var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	npmlog = require('npmlog'),
	validUrl = require('valid-url'),
	ValidationError = require('checkit').Error,
	models = require('../../models/models'),
	actionTargetTemplateDao = require('../../persistence/actionTargetTemplateDao'),
	actionTypeDao = require('../../persistence/actionTypeDao'),
	actionTypeConverter = require('../../converters/actionTypeConverter'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/actionTypes');

module.exports = function (app) {
  app.use(resourceService.basePath, router);

	router.param('id', function (req, res, next) {
		return actionTypeDao
			.findByIdAndUser(req.params.id, req.userModel)
			.then(function(actionType) {
				req.actionType = actionType;
				next();
			})
			.catch(actionTypeDao.model.NotFoundError, function(err) {
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
		else {
			return resourceService.validationError(res, { actionTargetTemplateId: [ 'The action target template id is mandatory' ]}).end();;
		}
	})
	.get(function(req, res, next) {
		return actionTypeDao
			.findByActionTargetTemplate(req.actionTargetTemplate, { name: req.query.name })
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

		actionTypeDao
			.findByType(actionType.type)
			.then(function(actionTypeFound) {
				if (actionTypeFound) {
					return resourceService.validationError(res, {type: ['Type must be unique.']}).end();
				}
				else {
					actionTargetTemplateDao.
						findByIdAndUser(actionType.actionTargetTemplateId, req.userModel)
						.then(function (actionTargetTemplate) {
							actionTypeDao
								.createAndSave(actionType, actionTargetTemplate)
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
						})
						.catch(actionTargetTemplateDao.model.NotFoundError, function (err) {
							return resourceService.validationError(res, {actionTargetTemplateId: ['No action target template found.']}).end();
						});
				}
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
					return resourceService.validationError(res, e);
				});
		}
		else {
			return resourceService.location(res, 304, actionType).end();
		}
	});