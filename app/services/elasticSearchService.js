var
	_ = require('underscore'),
	config = require('../../config/config'),
	elasticsearch = require('elasticsearch'),
	stringService = require('./stringService');

var client = new elasticsearch.Client({
  host: config.elasticSearch.host + ':' + config.elasticSearch.port,
  log: 'info'
});

module.exports = {
	saveEvent: function(event) {
		if (config.elasticSearch.enable) {
			client.create({
			  index: 'iflux-events',
			  type: 'json',
			  id: stringService.hash(stringService.generateEventId() + '#' + event.timestamp),
			  body: event
			},
			function (error, response) {
				if (!_.isUndefined(error)) {
					console.log(error);
				}
				else {
					console.log("Saved event in Elastic Search");
				}
			});
		}
	},

	saveMatch: function(match) {
		if (config.elasticSearch.enable) {
			client.create({
			  index: 'iflux-event-matches',
			  type: 'json',
			  id: stringService.hash(stringService.generateEventId() + '#' + match.event.timestamp),
			  body: match
			},
			function (error, response) {
				if (!_.isUndefined(error)) {
					console.log(error);
				}
				else {
					console.log("Saved matched event in Elastic Search.");
				}
			});
		}
	}
};