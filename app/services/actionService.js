var
	_ = require('underscore'),
	Client = require('iflux-node-client').Client;

var iFluxClient = new Client();

module.exports = {
	processActions: function (actions) {
		console.log("Triggered " + actions.length + " actions.");

		_.each(actions, function(action) {
			iFluxClient.executeAction(action);
		});
	}
};

