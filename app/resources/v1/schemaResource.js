var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	eventTypeDao = require('../../persistnce/eventTypeDao'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/schemas');

module.exports = function (app) {
  app.use(resourceService.basePath, router);
};

router.route('/eventTypes')
	.get(function(req, res, next) {
		var type = req.protocol + '://' + req.get('host') + req.originalUrl;

		console.log(type);

		return eventTypeDao
			.findByType(type)
			.then(function(eventType) {
				if (eventType.get('schema')) {
					return resourceService.ok(res, eventType.get('schema'));
				}
				else {
					return resourceService.notFound(res);
				}
			})
			.catch(eventTypeDao.model.NotFoundError, function(err) {
				return resourceService.notFound(res);
			});
	});
