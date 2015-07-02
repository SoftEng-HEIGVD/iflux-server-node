var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	actionTypeDao = require('../../persistence/actionTypeDao'),
	eventTypeDao = require('../../persistence/eventTypeDao'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/schemas');

module.exports = function (app) {
  app.use(resourceService.basePath, router);
};

router.route('/actionTypes/*')
	.get(function(req, res, next) {
		var type = req.protocol + '://' + req.get('host') + req.originalUrl;

		return actionTypeDao
			.findByType(type)
			.then(function(actionType) {
				if (actionType && actionType.get('actionTypeSchema')) {
					return resourceService.ok(res, actionType.get('actionTypeSchema'));
				}
				else {
					return resourceService.notFound(res);
				}
			});
	});

router.route('/eventTypes/*')
	.get(function(req, res, next) {
		var type = req.protocol + '://' + req.get('host') + req.originalUrl;

		return eventTypeDao
			.findByType(type)
			.then(function(eventType) {
				if (eventType && eventType.get('eventTypeSchema')) {
					return resourceService.ok(res, eventType.get('eventTypeSchema'));
				}
				else {
					return resourceService.notFound(res);
				}
			});
	});
