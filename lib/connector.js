var _ = require('underscore');

module.exports = function(restClient, npmlog, bluebird) {
	/**
	 * Constructor for the iFLUX Connector.
	 *
	 * @constructor
	 */
	function Connector() {
		this.restClient = new restClient.Client();
	}

	_.extend(Connector.prototype, {
		/**
		 * Execute a list of actions by POSTing the action to /actions endpoint
		 *
		 * @param {Object[]} actions The actions to execute
		 */
		executeActions: function (actions) {
			var targets = {};

			// Prepare the collection of actions for each target
			_.each(actions, function(action) {
				if (_.isUndefined(targets[action.targetUrl])) {
					targets[action.targetUrl] = [];
				}

				targets[action.targetUrl].push(action.payload);
			});

			// Post actions to targets
			_.each(targets, function(targetActions, targetUrl) {
				npmlog.info("POSTing actions to " + targetUrl);

				var args = {
					data: targetActions,
					headers: {"Content-Type": "application/json"}
				};

				this.restClient.post(targetUrl, args, function (data, response) {
					npmlog.info(data);
				});

			}, this);
		},

		/**
		 * Execute an action by POSTing the action to /actions endpoint
		 *
		 * @param {Object} action The action to execute
		 */
		executeAction: function (action) {
			var actions = [];
			actions.push(action);

			this.executeActions(actions);
		},

		configureEventSourceInstance: function(eventSourceTemplate, eventSourceInstance) {
			var deferred = bluebird.defer();

			if (eventSourceTemplate.get('configurationUrl')) {
				npmlog.info("Configuring event source instance at " + eventSourceTemplate.get('configurationUrl'));

				var headers = {
					"Content-Type": "application/json"
				};

				if (eventSourceTemplate.get('configurationToken')) {
					headers.Authorization = 'bearer ' + eventSourceTemplate.get('configurationToken');
				}

				var options = {
					data: {
						eventSourceInstanceId: eventSourceInstance.get('eventSourceInstanceId'),
						properties: eventSourceInstance.get('configuration')
					},
					headers: headers
				};

				this.restClient
					.post(eventSourceTemplate.get('configurationUrl'), options,
						function(data, response) {
							npmlog.info(data);
							deferred.resolve(data);
						}
					)
					.on('error', function(err) {
						deferred.reject(err);
					});
			}

			else {
				deferred.resolve();
				npmlog.info('There is nothing to configure. Configuration URL is missing.');
			}

			return deferred.promise;
		},

		configureActionTargetInstance: function(actionTargetTemplate, actionTargetInstance) {
			if (actionTargetTemplate.configurationUrl) {
				npmlog.info("Configuring action target instance at " + actionTargetTemplate.configurationUrl);

				var headers = {
					"Content-Type": "application/json"
				};

				if (actionTargetTemplate.configurationToken) {
					headers.Authorization = 'bearer ' + actionTargetTemplate.configurationToken;
				}

				var options = {
					data: {
						actionTargetInstanceId: actionTargetInstance.actionTargetInstanceId,
						properties: actionTargetInstance.configuration
					},
					headers: headers
				};

				var deferred = bluebird.defer();

				this.restClient
					.post(actionTargetTemplate.configurationUrl, options,
						function(data, response) {
							npmlog.info(data);
							deferred.resolve(data);
						}
					)
					.on('error', function(err) {
						deferred.reject(err);
					});

				return deferred.promise;
			}

			else {
				npmlog.info('There is nothing to configure. Configuration URL is missing.');
			}
		}
	});

	// Exports
	return Connector;
};

module.exports['@require'] = [ 'node-rest-client', 'npmlog', 'bluebird' ];