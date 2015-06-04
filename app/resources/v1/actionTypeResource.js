var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	npmlog = require('npmlog'),
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
			.findByActionTargetTemplate(req.actionTargetTemplate)
			.then(function (actionTypes) {
				return resourceService.ok(res,
					_.map(actionTypes, function (actionType) {
						return actionTypeConverter.convert(actionType);
					})
				);
			});
	})

	.post(function(req, res, next) {
		var actionType = req.body;

		actionTargetTemplateDao.
			findByIdAndUser(actionType.actionTargetTemplateId, req.userModel)
			.then(function(actionTargetTemplate) {
				actionTypeDao
					.createAndSave(actionType, actionTargetTemplate)
					.then(function(actionTargetTemplateSaved) {
						return resourceService.location(res, 201, actionTargetTemplateSaved).end();
					})
					.catch(ValidationError, function(e) {
						return resourceService.validationError(res, e).end();
					})
					.catch(function(err) {
						npmlog.error(err);
						return next(err)
					});
			})
			.catch(actionTargetTemplateDao.model.NotFoundError, function(err) {
				return resourceService.validationError(res, { actionTargetTemplateId: [ 'No action target template found.' ] }).end();
			});
	});

router.route('/:id')
	.get(function(req, res, next) {
		return resourceService.ok(res, actionTypeConverter.convert(req.actionType));;
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