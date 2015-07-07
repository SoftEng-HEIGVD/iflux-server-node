var _ = require('underscore');

module.exports = function(restClient, bluebird, print) {
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

				targets[action.targetUrl].push({
					target: action.target,
					type: action.type,
					properties: action.properties
				});
			});

			// Post actions to targets
			_.each(targets, function(targetActions, targetUrl) {
				print('POSTing actions to: %s', targetUrl);

				var args = {
					data: targetActions,
					headers: {"Content-Type": "application/json"}
				};

				this.restClient.post(targetUrl, args, function (data, response) {
					print(data.toString());
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

		configureEventSource: function(eventSourceTemplate, eventSource) {
			var deferred = bluebird.defer();

			if (eventSourceTemplate.get('configurationUrl')) {
				print('Configuring event source at %s', eventSourceTemplate.get('configurationUrl'));

				var headers = {
					"Content-Type": "application/json"
				};

				if (eventSourceTemplate.get('configurationToken')) {
					headers.Authorization = 'bearer ' + eventSourceTemplate.get('configurationToken');
				}

				var options = {
					data: {
						source: eventSource.get('generatedIdentifier'),
						properties: eventSource.get('configuration')
					},
					headers: headers
				};

				this.restClient
					.post(eventSourceTemplate.get('configurationUrl'), options,
						function(data, response) {
							print(data);
							deferred.resolve(data);
						}
					)
					.on('error', function(err) {
						deferred.reject(err);
					});
			}

			else {
				deferred.resolve();
				print('There is nothing to configure. Configuration URL is missing.');
			}

			return deferred.promise;
		},

		configureActionTarget: function(actionTargetTemplate, actionTarget) {
			var deferred = bluebird.defer();

			if (actionTargetTemplate.get('configurationUrl')) {
				print('Configuring action target at %s', actionTargetTemplate.get('configurationUrl'));

				var headers = {
					"Content-Type": "application/json"
				};

				if (actionTargetTemplate.get('configurationToken')) {
					headers.Authorization = 'bearer ' + actionTargetTemplate.get('configurationToken');
				}

				var options = {
					data: {
						target: actionTarget.get('generatedIdentifier'),
						properties: actionTarget.get('configuration')
					},
					headers: headers
				};

				this.restClient
					.post(actionTargetTemplate.get('configurationUrl'), options,
						function(data, response) {
							print(data);
							deferred.resolve(data);
						}
					)
					.on('error', function(err) {
						deferred.reject(err);
					});
			}

			else {
				deferred.resolve();
				print('There is nothing to configure. Configuration URL is missing.');
			}

			return deferred.promise;
		}
	});

	// Exports
	return Connector;
};

module.exports['@require'] = [ 'node-rest-client', 'bluebird', 'print' ];