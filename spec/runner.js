require('dotenv').config({ path: '../.env' });

var
	_ = require('underscore'),
	s = require('underscore.string'),
	Promise = require('bluebird'),
	colors = require('colors'),
	knex = require('../config/bookshelf').knex;

require('../app.js');

var specs = require('require-directory')(module, './api');

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

var
	deferred = Promise.defer(),
	promise = deferred.promise;

_.each(specs, function(spec, specName) {
	if (s.endsWith(specName, '.spec')) {
		if (spec.after) {
			_.each(deletes, function(del) {
				spec.after(del);
			});

			promise = spec.run(promise);
		}
	}
});

promise.finally(function() { process.exit(); });

deferred.resolve();