var express = require('express'),
  config = require('./config/config'),
  glob = require('glob'),
	bookshelf = require('./config/bookshelf'),
	// Load the models
	models = require('./app/models/models');

var app = express();

app.set('bookshelf', bookshelf);

require('./config/express')(app, config);

require('./app/services/kafkaService').listen();

try {
	require('./app/services/ruleEngineService').populate();
}
catch (err) {
	console.log("Unable to early load the rules.");
	console.log(err);
}

app.listen(config.port);

