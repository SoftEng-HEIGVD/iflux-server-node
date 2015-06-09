var
	_ = require('underscore'),
	config = require('../../config/config'),
	kafka = require('kafka-node'),
	Consumer = kafka.Consumer,
	elasticSearchService = require('./elasticSearchService'),
	ruleEngineService = require('./ruleEngineService'),
	timeService = require('./timeService');

var client, consumer, producer;

function messageHandler(message) {
	var event = JSON.parse(message.value);
	event.receivedAt = timeService.timestamp();
	elasticSearchService.saveEvent(event);
	ruleEngineService.match(event);
}

function consumerErrorHandler(error) {
	if (!_.isUndefined(error)) {
		console.log(error);
	}
	setTimeout(setup, 5000);
}

function consumerSetup() {
	consumer = new Consumer(client, [{ topic: config.kafka.eventTopic }]);
	consumer.on('message', messageHandler);
	consumer.on('error', consumerErrorHandler);
}

function setup() {
	if (client) {
		try {
			client.close();
		}
		catch (err) {
			console.log(err);
		}
	}

	if (consumer) {
		try {
			consumer.close();
		}
		catch (err) {
			console.log(err);
		}
	}

	client = kafka.Client(config.kafka.connectionString, config.kafka.clientId);

	consumerSetup();
}


module.exports = {
	listen: function() {
		if (config.kafka.enable) {
			setup();
		}
	}
};