var
	_ = require('underscore'),
	q = require('q'),
	mongoose = require('mongoose'),
	config = require('../config/config'),
	Schema = mongoose.Schema;

mongoose.connect(config.db);
var conn = mongoose.connection;

conn.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});

module.exports = {
	requiresDowntime: FIXME, // true or false

	up: function(callback) {
		// your migration goes here
		callback();
	},

	down: function(callback) {
		// your reverse migration goes here
		callback();
	},

	test: function(callback) {
		// your test goes here
		callback();
	}
};