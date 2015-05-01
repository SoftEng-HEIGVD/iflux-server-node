require('dotenv').config({ path: '../.env' });

var
	_ = require('underscore'),
	s = require('underscore.string'),
	Promise = require('bluebird'),
	colors = require('colors'),
	copilot = require('api-copilot'),
	knex = require('../config/bookshelf').knex,
	utils = require('./utils');

require('../app.js');

var scenarii = require('require-directory')(module, '.');

function del(table) {
	return function() {
		return knex(table).del();
	}
}

var deletes = [
	del('event_types'),
	del('event_source_templates'),
	del('organizations_users'),
	del('users'),
	del('organizations')
];

var prom = Promise.resolve();

_.each(scenarii, function(scenario, scenarioName) {
	if (s.endsWith(scenarioName, 'scenario')) {

		new copilot.logger(scenario);

		_.each(deletes, function(del) {
			prom = prom.then(del);
		});

		prom = prom.then(function() {
			utils.reset();
			return scenario.run({});
		});
	}
});

prom.finally(function() {
	process.exit();
});