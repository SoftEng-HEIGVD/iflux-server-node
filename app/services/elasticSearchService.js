var
	_ = require('underscore'),
	config = require('../../config/config'),
	stringService = require('./stringService');

function renameIdFields(obj) {
	if (!_.isNumber(obj) && !_.isString(obj) && !_.isArray(obj)) {
		_.each(obj, function (value, key) {
			if (key === 'id') {
				delete obj['id'];
				obj['dbid'] = value;
			}
			else if (!_.isString(value) && !_.isNumber(value) && !_.isArray(value)) {
				renameIdFields(value);
			}
		}, this);
	}
}

module.exports = function(elasticsearch, print) {
	var client = new elasticsearch.Client({
	  host: config.elasticSearch.host + ':' + config.elasticSearch.port,
	  log: 'info'
	});

	return {
		saveEvent: function(event) {
			if (config.elasticSearch.enable) {
				renameIdFields(event);

				var esItem = {
					index: 'iflux-events',
					type: 'json',
					id: stringService.hash(stringService.generateEventId() + '#' + event.timestamp),
					body: event
				};

				client.create(esItem, function (error, response) {
					if (!_.isUndefined(error)) {
						print(error);
						print(response);
					}
					else {
						print('Saved event in Elastic Search with id: %s', esItem.id);
					}
				});
			}
		},

		saveMatch: function(match) {
			if (config.elasticSearch.enable) {
				renameIdFields(match);

				var esItem = {
					index: 'iflux-event-matches',
					type: 'json',
					id: stringService.hash(stringService.generateEventId() + '#' + match.event.timestamp),
					body: match
				};

				client.create(esItem, function (error, response) {
					if (!_.isUndefined(error)) {
						print(error);
						print(response);
					}
					else {
						print('Saved matched event in Elastic Search with id: %s.', esItem.id);
					}
				});
			}
		}
	}
};

module.exports['@singleton'] = true;
module.exports['@require'] = [ 'elasticsearch', 'print' ];