var express = require('express'),
  config = require('./config/config'),
  glob = require('glob'),
	bookshelf = require('./config/bookshelf'),
	// Load the models
	models = require('./app/models/models');

var app = express();

app.set('bookshelf', bookshelf);

require('./config/express')(app, config);

app.listen(config.port);

