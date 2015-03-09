var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	ruleEngineService = require('../services/ruleEngineService');

module.exports = function (app) {
  app.use('/events', router);
};

router.route('/')
	/**
	 * POST /events is invoked by clients to notify that a list of events have occcured.
	 * The body of the request is a list of events. Every event has a timestamp, a type,
	 * a source and a list of properties
	 *
	 * @see {@link http://www.iflux.io/api/reference/#events|REST API Specification}
	 */
	.post(function(req, res) {
  	var events = req.body;

		_.each(events, function(event) {
			ruleEngineService.processEvent(event);
		});

		res.send('respond with a resource');
	});
