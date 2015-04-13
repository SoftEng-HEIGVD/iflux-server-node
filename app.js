var express = require('express'),
  config = require('./config/config'),
  glob = require('glob'),
	bookshelf = require('./config/bookshelf'),
	models = require('./app/models/models');
  //mongoose = require('mongoose');

//mongoose.connect(config.db);
//var db = mongoose.connection;
//db.on('error', function () {
//  throw new Error('unable to connect to database at ' + config.db);
//});

//var models = glob.sync(config.root + '/app/models/*.js');
//models.forEach(function (model) {
//  require(model);
//});

var app = express();

app.set('bookshelf', bookshelf);
app.set('models', models);

//var models = require('require-directory')(module, './models');
//for(var modelName in models) {
//	global[modelName] = models[modelName];
//	app.set(modelName, models[modelName]);
//}

require('./config/express')(app, config);

app.listen(config.port);

