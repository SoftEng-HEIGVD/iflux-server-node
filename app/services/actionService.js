var
	domain = require('domain'),
	d = domain.create(),
	_ = require('underscore'),
	Client = require('iflux-node-client').Client;

d.on('error', function(err) {
	console.log("Unable to process the action.");
	console.log(err);
});

var iFluxClient = new Client();

module.exports = {
	processActions: function (actions) {
		console.log("Triggered " + actions.length + " actions.");

		_.each(actions, function(action) {
			d.run(function() {
				iFluxClient.executeAction(action);
			});
		});
	}
};

