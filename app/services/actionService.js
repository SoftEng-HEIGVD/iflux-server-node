var
	_ = require('underscore'),
	Promise = require('bluebird'),
	domain = require('domain'),
	d = domain.create(),
	Connector = require('../../lib/ioc').create('connector');

d.on('error', function(err) {
	console.log("Unable to process the actions.");
	//console.log(err);
});

var connector = new Connector();

module.exports = {
	processActions: function (actions) {
		return Promise.resolve().then(function() {
			console.log("Triggered " + actions.length + " actions.");

			d.run(function () {
				connector.executeActions(actions);
			});
		});
	}
};

