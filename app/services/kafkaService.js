var
	_ = require('underscore'),
	config = require('../../config/config'),
  sleep = require('sleep'),
	kafka = require('kafka-node'),
	Consumer = kafka.Consumer,
  Offset = kafka.Offset,
	elasticSearchService = require('../../lib/ioc').create('elasticSearchService'),
  eventService = require('./eventService');

var client, consumer, producer;

function messageHandler(message) {
	var events = JSON.parse(message.value);
  eventService.eventsHandler(events);
}

function consumerErrorHandler(error) {
	if (!_.isUndefined(error)) {
		console.log(error);
	}
	setTimeout(setup, 5000);
}

function consumerSetup(offset) {
	consumer = new Consumer(
    client,
    [{ topic: config.kafka.eventTopic, offset: offset }],
    {
      fromOffset: true
    }
  );

  consumer.on('message', messageHandler);
	consumer.on('error', consumerErrorHandler);
}

function offsetSetup() {
  var offset = new Offset(client);

  offset.on('ready', function() {
    recurseOffsetSetup(offset, 1);
  });
}

function recurseOffsetSetup(offset, time) {
  offset.fetch([{ topic: config.kafka.eventTopic, time: -1 }], function (err, data) {
    if (err) {
      if (time > 256) {
        console.log('Too many attempts to connect to: ' + config.kafka.eventTopic + '. Iflux will stop now.');
        throw new Error(err);
      }

      console.log('Unable to connect to: ' + config.kafka.eventTopic + '. Retry in ' + time + 's.');

      sleep.sleep(time);

      recurseOffsetSetup(offset, time * 2);
    }
    else {
      console.log('Connection to: ' + config.kafka.eventTopic + ' established.');
      consumerSetup(data[config.kafka.eventTopic][0][0]);
    }
  });
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

	offsetSetup();
}


module.exports = {
	listen: function() {
		if (config.kafka.enable) {
			setup();
		}
	}
};