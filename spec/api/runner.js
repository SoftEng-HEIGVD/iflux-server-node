require('dotenv').config({ path: '../../.env' });

var
	_ = require('underscore'),
	s = require('underscore.string'),
	Promise = require('bluebird'),
	colors = require('colors'),
	knex = require('../../config/bookshelf').knex,
	config = require('../../config/config'),
	mockServerClient = require('mockserver-client').mockServerClient;

require('../../app.js');

var specs = require('require-directory')(module, './v1');

function del(table) {
	return function() {
		return knex(table).del();
	};
}

var deletes = [
	del('rules'),
	del('action_types'),
	del('action_target_instances'),
	del('action_target_templates'),
	del('event_types'),
	del('event_source_instances'),
	del('event_source_templates'),
	del('organizations_users'),
	del('users'),
	del('organizations')
];

var
	deferred = Promise.defer(),
	promise = deferred.promise,
	counters = {
		expectations: 0,
		failed: 0
	};

_.each(deletes, function(del) {
	promise = promise.then(del);
});

_.each(specs, function(spec, specName) {
	if (s.endsWith(specName, '.spec') && (process.env.RUN_SPEC === undefined || (process.env.RUN_SPEC && s.startsWith(specName, process.env.RUN_SPEC)))) {
		if (spec.after) {
			_.each(deletes, function(del) {
				spec.after(del);
			});

			var mockClient = mockServerClient('localhost', config.mockServer.serverPort);

			promise = promise.then(function() {
				mockClient.reset();
			});

			spec.setMockServerClient(mockClient);

			promise = spec.run(promise, { counters: counters });
		}
	}
});

promise = promise.then(function() {
	console.log('\n\nResults: ' + '%s'.red + ' failed / ' + '%s'.green + ' expectations.', counters.failed, counters.expectations);
});

promise.finally(function() {
	process.exit();
});

deferred.resolve();