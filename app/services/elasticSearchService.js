var
	_ = require('underscore'),
	config = require('../../config/config'),
	elasticsearch = require('elasticsearch'),
	stringService = require('./stringService');

var client = new elasticsearch.Client({
  host: config.elasticSearch.host + ':' + config.elasticSearch.port,
  log: 'trace'
});

module.exports = {
	saveEvent: function(event) {
		if (config.elasticSearch.enable) {
			client.create({
			  index: 'iflux-events',
			  type: 'json',
			  id: stringService.hash(event.sourceId + '#' + event.typeId + '#' + event.timestamp),
			  body: event
			},
			function (error, response) {
				console.log(error);
			});
		}
	}
};