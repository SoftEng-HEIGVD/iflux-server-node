var
	config = require('../../../config/config'),
  _ = require('underscore'),
	express = require('express'),
  router = express.Router(),
  eventService = require('../../services/eventService'),
	resourceService = require('../../services/resourceServiceFactory')('/v1/events');

module.exports = function (app) {
  if (!config.kafka.enable) {
    app.use(resourceService.basePath, router);
  }
};

if (!config.kafka.enable) {
  router.route('/')
    /**
     * POST /events is invoked by clients to notify that a list of events have occurred.
     * The body of the request is a list of events. Every event has a timestamp, a type,
     * a source and a list of properties
     *
     * @see {@link http://www.iflux.io/api/reference/#events|REST API Specification}
     */
    .post(function (req, res) {
      try {
        eventService.eventsHandler(req.body);
        resourceService.noContent(res).end();
      }
      catch (err) {
        resourceService.serverError(res, err).end();
      }
    });
}