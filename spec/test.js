var
	_ = require('underscore'),
	s = require('underscore.string'),
	Promise = require('bluebird'),
	request = require('request'),
	colors = require('colors');

//var INDEX_REGEXP = new RegExp('(0|[1-9][0-9]*)', 'g');

function addExpectation(step, expectation) {
	if (step.expectations === undefined) {
		step.expectations = [];
	}

	step.expectations.push(expectation);
}

function testMessage(str) {
	return "    " + str;
}

module.exports = function(name) {
	return {
		name: name,
		steps: [],
		afters: [],
		currentStep: null,
		headers: {},
		data: {},

		baseUrl: function(baseUrl) {
			this.baseUrl = baseUrl;
			return this;
		},

		setJson: function() {
			this.json = true;
			return this;
		},

		stop: function() {
			this.stopProcess = true;
			return this;
		},

		describe: function(text) {
			this.steps.push({ name: text });
			this.currentStep = this.steps[this.steps.length - 1];

			return this;
		},

		request: function(options, optionsEnrichmentFn) {
			// Check if we have to store data from response
			if (_.has(options, '_storeData')) {
				this.currentStep.storeData = options._storeData;
				options = _.omit(options, '_storeData');
			}

			// Check if an enrichment of the options must be done
			if (optionsEnrichmentFn) {
				this.currentStep.requestEnrichmentFn = optionsEnrichmentFn;
			}

			// Be sure the request has its own copy of the headers
			this.currentStep.headers = _.clone(this.headers);

			// Store the request options
			this.currentStep.request = _.extend({ simple:false, resolveWithFullResponse: true }, options);

			return this;
		},

		get: function(options, optionsEnrichmentFn) {
			return this.request(_.extend(options, { method: 'GET' }), optionsEnrichmentFn);
		},

		post: function(options, optionsEnrichmentFn) {
			return this.request(_.extend(options, { method: 'POST' }), optionsEnrichmentFn);
		},

		patch: function(options, optionsEnrichmentFn) {
			return this.request(_.extend(options, { method: 'PATCH' }), optionsEnrichmentFn);
		},

		setData: function(key, value) {
			this.data[key] = value;
		},

		getData: function(key) {
			return this.data[key];
		},

		setHeader: function(name, content) {
			var headers = {};

			headers[name] = content;

			return this.setHeaders(headers);
		},

		setHeaders: function(headers) {
			this.headers = _.extend(this.headers, headers);
			return this;
		},

		removeHeader: function(name) {
			if (this.headers) {
				delete this.headers[name];
			}
			return this;
		},

		jwtAuthentication: function(tokenFn) {
			return this.setHeader('Authorization', function() {
				return 'Bearer ' + _.bind(tokenFn, this)();
			});
		},

		printRequest: function() {
			this.currentStep.printRequest = true;

			return this;
		},

		printResponse: function(options) {
			if (options) {
				this.currentStep.printResponse = options;
			}
			else {
				this.currentStep.printResponse = true;
			}

			return this;
		},

		noAfter: function() {
			this.doNotRunAfters = true;
			return this;
		},

		expectStatusCode: function(expectedCode) {
			addExpectation(this.currentStep, function(response) {
				if (expectedCode != response.statusCode) {
					console.log(testMessage('Expected status code: %s, received: %s').red, expectedCode, response.statusCode);
				}
				else {
					console.log(testMessage('Expected status code: %s').green, expectedCode);
				}

				return response;
			});

			return this;
		},

		expectLocationHeader: function(locationPattern) {
			addExpectation(this.currentStep, function(response) {
				// Check if the location header is present
				if (response.headers.location) {
					var locationParts = response.headers.location.split('/');
					var locationPatternParts = locationPattern.split('/');

					// Check if the location has the same number of parts
					if (locationParts.length == locationPatternParts.length) {
						// Analysis of each part
						var error = false;
						for (var i = 0; i < locationPatternParts.length; i++) {
							// Check if the current analysed part is supposed to be an id
							if (s.startsWith(locationPatternParts[i], ':id')) {
								// Check default patter for ID
								if (!new RegExp('[1-9][0-9]*', 'g').test(locationParts[i])) {
									error = true;
									console.log(testMessage('Expected location pattern: %s does not match the location retrieved: %s').red, locationPattern, response.headers.location);
								}
							}

							// Check if the current part analyzed is regex pattern
							else if (s.startsWith(locationPatternParts[i], 'reg:')) {
								// Check the validity against the pattern
								if (new RegExp(locationPatternParts[i].split(':')[1], 'g').test(locationParts[i])) {
									error = true;
									console.log(testMessage('Expected location pattern: %s does not match the location retrieved: %s').red, locationPattern, response.headers.location);
									break;
								}
							}
							else {
								if (locationPatternParts[i] != locationParts[i]) {
									error = true;
									console.log(testMessage('Expected location pattern: %s does not match the location retrieved: %s').red, locationPattern, response.headers.location);
									break;
								}
							}
						}

						if (!error) {
							console.log(testMessage('Expected location to be %s').green, response.headers.location);
						}
					}
					else {
						console.log(testMessage('Expected location pattern: %s does not match the location retrieved: %s').red, locationPattern, response.headers.location);
					}
				}
				else {
					console.log(testMessage('Expected to find location header but was not found.').red)
				}

				return response;
			});

			return this;
		},

		expectJsonToHavePath: function(paths) {
			if (_.isString(paths)) {
				paths = [ paths ];
			}

			addExpectation(this.currentStep, function(response) {
				_.each(paths, function(path) {
					var
						currentNode = response.body,
						currentPath = '',
						error = false,
						pathParts = path.split('.');

					for (var i = 0; i < pathParts.length; i++) {
						currentPath += '.' + pathParts[i];

						var key = pathParts[i];

						if ((_.isArray(currentNode) && !currentNode[key]) || !_.has(currentNode, key)) {
							console.log(key);
							error = true;
							console.log(testMessage('Expected to found path: %s, stopped at: %s, %s not found.').red, path, currentPath.substr(1), key);
							break;
						}

						currentNode = currentNode[key];
					}

					if (!error) {
						console.log(testMessage('Expected to found path: %s').green, path);
					}
				});

				return response;
			});

			return this;
		},

		expectJsonCollectionToHaveSize: function(expectedSize) {
			addExpectation(this.currentStep, function(response) {
				// If not an array
				if (!_.isArray(response.body)) {
					// If a string
					if (_.isString(response.body)) {
						console.log(testMessage('Expected a collection, received a string'.red));
					}
					else {
						console.log(testMessage('Expected a collection, received an object'.red));
					}
				}

				// Check size
				else if (response.body.length != expectedSize) {
					console.log(testMessage('Expected a collection of size: %s, received a collection of size: %s'.red), expectedSize, response.body.length);
				}

				else {
					console.log(testMessage('Expected a collection of size: %s'.green), expectedSize);
				}

				return response;
			});

			return this;
		},

		expectJsonToBe: function(expected) {
			addExpectation(this.currentStep, function(response) {
				console.log(testMessage('TODO: Implement this EXACT comparison of JSON objects.').cyan);
				return response;
			});

			return this;
		},

		expectJsonToBeAtLeast: function(expected) {
			addExpectation(this.currentStep, function(response) {
				console.log(testMessage('TODO: Implement this LEFT comparison of JSON objects.').cyan);
				return response;
			});

			return this;
		},

		after: function(fn) {
			this.afters.push(fn);

			return this;
		},

		run: function(promise) {
			// Be sure we have access to this in any promise handler
			promise = promise.bind(this);

			// Scenario name
			promise = promise.then(function() {
				console.log();
				console.log();
				console.log(("Running: " + name).blue.bold);
			});

			_.each(this.steps, function(step) {
				// Prepare an enriched configuration for request
				promise = promise.then(function() { return {}; });

				// If additional headers are present
				if (step.headers) {
					// Be sure the configuration for headers is ready
					promise = promise.then(function(enrichedRequest) {
						enrichedRequest.headers = {};
						return enrichedRequest;
					});

					// Add each header
					_.each(step.headers, function(content, name) {
						// Check if the header is a function or not
						if (_.isFunction(content)) {
							promise = promise.then(function(enrichedRequest) {
								enrichedRequest.headers[name] = _.bind(content, this)();
								return enrichedRequest;
							});
						}
						else {
							promise = promise.then(function(enrichedRequest) {
								enrichedRequest.headers[name] = content;
								return enrichedRequest;
							});
						}
					}, this);
				}

				// Enriched the request with additional configuration
				promise = promise.then(function(enrichedRequest) {
					step.request = _.extend(step.request, enrichedRequest);
				});

				// Prepare enrichment of the request from the optional function
				promise = promise.then(function() {
					// Process the enrichment function
					if (step.requestEnrichmentFn) {
						step.request = _.extend(step.request, _.bind(step.requestEnrichmentFn, this)());
					}

					// Complete the base URL
					if (this.baseUrl) {
						step.request.url = this.baseUrl + step.request.url;
					}

					// Be sure the API is JSON by default
					if (this.json && step.request.json === undefined) {
						step.request.json = true;
					}
				});

				// Step name
				promise = promise.then(function() {
					console.log(("  [" + step.request.method + " " + step.request.url + "] - " + step.name.bold).yellow);
				});

				// Print the request
				if (step.printRequest) {
					promise = promise.then(function() {
						console.log("################# REQUEST ################".magenta);
						console.log(step.request);
						console.log("##########################################".magenta);
					});
				}

				// Preapre the request step
				promise = promise.then(function() {
					var def = Promise.defer();

					request(
						step.request,
						function(err, httpResponse) {
							if (err) {
								def.reject(httpResponse);
							}
							else {
								def.resolve(httpResponse);
							}
						}
					);

					// Store the latest response
					return def.promise.bind(this)
						.then(function(response) {
							this.response = response;

							if (step.storeData) {
								_.bind(step.storeData, this)();
							}

							return response;
						});
				});

				// Prepare expectation steps
				_.each(step.expectations, function(expectation) {
					promise = promise.then(expectation);
				}, this);

				// Print the response in light/heavy mode
				if (step.printResponse) {
					promise = promise.then(function(response) {
						console.log("################# RESPONSE ###############".magenta);
						if (step.printResponse.body) {
							console.log(response.body);
						}
						else {
							console.log(response);
						}
						console.log("##########################################".magenta);
					});
				}
			}, this);

			// Prepare after steps
			if (!this.doNotRunAfters) {
				_.each(this.afters, function (after) {
					promise = promise.then(after);
				}, this);
			}

			// Stop the execution right in place
			if (this.stopProcess) {
				promise = promise.then(function() {
					process.exit();
				});
			}

			// Catch all
			promise = promise.catch(function(err) {
				console.log("something went wrong".red);
				console.log(err);
				if (err.stack) {
					console.log(err.stack);
				}
			});

			return promise;
		}
	}
};