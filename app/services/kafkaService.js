var
	_ = require('underscore'),
	config = require('../../config/config'),
	kafka = require('kafka-node'),
	Consumer = kafka.Consumer,
	elasticSearchService = require('./elasticSearchService');

var client, consumer, producer;

function messageHandler(message) {
  console.log(message);

	elasticSearchService.saveEvent(JSON.parse(message.value));
}

function consumerErrorHandler(error) {
	console.log(error);
	setTimeout(setup, 5000);
}

function consumerSetup() {
	consumer = new Consumer(client, [{ topic: config.kafka.eventTopic }]);
	consumer.on('message', messageHandler);
	consumer.on('error', consumerErrorHandler);
}

//function producerErrorHandler(error) {
//	console.log(error);
//  setTimeout(setup, 5000);
//}
//
//function producerSetup() {
//	producer = new Producer(client);
//	producer.on('ready', consumerSetup);
//	producer.on('error', producerErrorHandler);
//}

function setup() {
	if (client) {
		try {
			client.close();
		}
		catch (err) {
			console.log(err);
		}
	}

	//if (producer) {
	//	try {
	//		producer.close();
	//	}
	//	catch (err) {
	//		console.log(err);
	//	}
	//}

	if (consumer) {
		try {
			consumer.close();
		}
		catch (err) {
			console.log(err);
		}
	}

	client = kafka.Client(config.kafka.connectionString, config.kafka.clientId);

	//producerSetup();
	consumerSetup();
}


module.exports = {
	listen: function() {
		if (config.kafka.enable) {
			setup();
		}
	}
};