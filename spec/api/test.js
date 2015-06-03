var
	_ = require('underscore'),
	s = require('underscore.string'),
	Promise = require('bluebird'),
	request = require('request'),
	colors = require('colors');

//var INDEX_REGEXP = new RegExp('(0|[1-9][0-9]*)', 'g');

function addExpectation(test, expectation) {
	if (test.currentStep.expectations === undefined) {
		test.currentStep.expectations = [];
	}

	test.counters.expectations++;
	test.currentStep.expectations.push(expectation);
}

function testMessage(str) {
	return "    " + str;
}

function printJsonErrorObject(obj, lvl) {
	var indent = lvl * 2;

	_.each(obj, function(value, name) {
		var msg;

		if (_.isString(value)) {
			msg = name + ': ' + value;
			msg = s.pad(msg, msg.length + indent);
			console.log(msg.red);
		}
		else {
			msg = name + ':';
			msg = s.pad(msg, msg.length + indent);
			console.log(msg.red);
			printJsonErrorObject(value, lvl + 1);
		}
	}, this);
}

function compareExactJson(current, expected) {
	// Expect a string
	if (_.isString(expected)) {
		// String is not defined in the current
		if (!_.isString(current)) {
			return 'Expected to have the string: "' + expected + '" , got: ' + JSON.stringify(current);
		}

		// Check if the string is the same
		else if (current != expected) {
			return 'Expected to have the string: "' + expected + '" , got the string: "' + current + '"';
		}
	}

	// Expect a number
	else if (_.isNumber(expected)) {
		// Number is not defined in the current
		if (!_.isNumber(current)) {
			return 'Expected to have the number: "' + expected + '" , got: ' + JSON.stringify(current);
		}

		// Check if the number is the same
		else if (current != expected) {
			return 'Expected to have the number: "' + expected + '" , got the number: "' + current + '"';
		}
	}

	// Expect an array
	else if (_.isArray(expected)) {
		// Array is not defined in current
		if (!_.isArray(current)) {
			return 'Expected to have an array, got: ' + JSON.stringify(current);
		}

		else {
			var arrayResult = {};

			// For each value in the expected array
			_.each(expected, function (value, idx) {
				// If it expects a string, is present and is the same
				if (_.isString(value) && (!_.isString(current[idx]) || value !== current[idx])) {
					arrayResult[idx] = 'Expected to have the string: "' + value + '" , got: ' + JSON.stringify(current[idx]);
				}

				// If it expects a number, is present and is the same
				else if (_.isNumber(value) && (!_.isNumber(current[idx]) || value !== current[idx])) {
					arrayResult[idx] = 'Expected to have the number: "' + value + '" , got: ' + JSON.stringify(current[idx]);
				}

				// If it expects an array, is an array
				else if (_.isArray(value) && !_.isArray(current[idx])) {
					arrayResult[idx] = 'Expected to have an array: ' + JSON.stringify(value) + ' , got: ' + JSON.stringify(current[idx]);
				}

				// Is an array or an object, should recurse
				else {
					var currentResult = compareExactJson(current[idx], value);

					if (currentResult && !_.isEmpty(currentResult)) {
						arrayResult[idx] = currentResult;
					}
				}
			}, this);

			if (!_.isEmpty(arrayResult)) {
				return arrayResult;
			}
		}
	}

	else {
		var objectResult = {};

		// Check if each property expected is present
		_.each(expected, function(value, name) {
			// Property not found
			if (!_.has(current, name)) {
				objectResult[name] = 'Expected to find property "' + name + '", but was not found.';
			}

			// Property found, then compare it
			else {
				var currentResult = compareExactJson(current[name], expected[name]);

				// Is there any error
				if (currentResult && !_.isEmpty(currentResult)) {
					objectResult[name] = currentResult;
				}
			}
		}, this);

		// Check if property are present in the current that is not present in the expected
		_.each(current, function(value, name) {
			// Property not found in expected
			if (!_.has(expected, name)) {
				objectResult[name] = 'Expected to not find property "' + name + '", but was found.';
			}
		}, this);

		if (!_.isEmpty(objectResult)) {
			return objectResult;
		}
	}
}

function compareContentJson(current, expected) {
	// Expect a string
	if (_.isString(expected)) {
		// String is not defined in the current
		if (!_.isString(current)) {
			return 'Expected to have the string: "' + expected + '" , got: ' + JSON.stringify(current);
		}

		// Check if the string is the same
		else if (current != expected) {
			return 'Expected to have the string: "' + expected + '" , got the string: "' + current + '"';
		}
	}

	// Expect a number
	else if (_.isNumber(expected)) {
		// Number is not defined in the current
		if (!_.isNumber(current)) {
			return 'Expected to have the number: "' + expected + '" , got: ' + JSON.stringify(current);
		}

		// Check if the number is the same
		else if (current != expected) {
			return 'Expected to have the number: "' + expected + '" , got the number: "' + current + '"';
		}
	}

	// Expect an array
	else if (_.isArray(expected)) {
		// Array is not defined in current
		if (!_.isArray(current)) {
			return 'Expected to have an array, got: ' + JSON.stringify(current);
		}

		else {
			var arrayResult = {};

			// For each value in the expected array
			_.each(expected, function (value, idx) {
				var found = false;

				// If it expects a string, is present and is the same
				if (_.isString(value)) {
					// Try to find the same string at any index in the current
					_.each(current, function(currentValue) {
						if (_.isString(currentValue) && value == currentValue) {
							found = true;
						}
					}, this);

					if (!found) {
						arrayResult[idx] = 'Expected to have the string: "' + value + '" , but not found in: ' + JSON.stringify(current);
					}
				}

				// If it expects a number, is present and is the same
				else if (_.isNumber(value)) {
					// Try to find the same number at any index in the current
					_.each(current, function(currentValue) {
						if (_.isNumber(currentValue) && value == currentValue) {
							found = true;
						}
					}, this);

					if (!found) {
						arrayResult[idx] = 'Expected to have the number: "' + value + '" , but not found in: ' + JSON.stringify(current);
					}
				}

				// If it expects an array, is an array
				else if (_.isArray(value) && !_.isArray(current[idx])) {
					// TODO: Find a way to improve this check. Currently, the check is absolute
					arrayResult[idx] = 'Expected to have an array: ' + JSON.stringify(value) + ' , got: ' + JSON.stringify(current[idx]);
				}

				// Is an array or an object, should recurse
				else {
					var currentResult = false;

					_.each(current, function(currentValue) {
						if (!currentResult) {
							var comparedResult = compareContentJson(currentValue, value);

							if (_.isEmpty(comparedResult)) {
								currentResult = true;
							}
						}
					}, this);

					if (!currentResult) {
						arrayResult[idx] = 'Expected to find a structure ' + JSON.stringify(value) + ', but not found in: ' + JSON.stringify(current);
					}
				}
			}, this);

			if (!_.isEmpty(arrayResult)) {
				return arrayResult;
			}
		}
	}

	else {
		var objectResult = {};

		// Check if each property expected is present
		_.each(expected, function(value, name) {
			// Property not found
			if (!_.has(current, name)) {
				objectResult[name] = 'Expected to find property "' + name + '", but was not found.';
			}

			// Property found, then compare it
			else {
				var currentResult = compareContentJson(current[name], expected[name]);

				// Is there any error
				if (currentResult && !_.isEmpty(currentResult)) {
					objectResult[name] = currentResult;
				}
			}
		}, this);

		if (!_.isEmpty(objectResult)) {
			return objectResult;
		}
	}
}

module.exports = function(name) {
	return {
		counters: {
			expectations: 0,
			failed: 0,
		},
		name: name,
		steps: [],
		afters: [],
		currentStep: null,
		headers: {},
		data: {},
		mockServerClient: null,

		baseUrl: function(baseUrl) {
			this.baseUrl = baseUrl;
			return this;
		},

		setJson: function() {
			this.json = true;
			return this;
		},

		setMockServerClient: function(mockServerClient) {
			this.mockServerClient = mockServerClient;
			return this;
		},

		mockRequest: function(request, response, times) {
			var config = {
				httpRequest: request,
				httpResponse: response
			};

			if (times) {
				config = _.extend(config, {
					times: times
				});
			}

			this.currentStep.mockRequest = config;

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

		delete: function(options, optionsEnrichmentFn) {
			return this.request(_.extend(options, { method: 'DELETE' }), optionsEnrichmentFn);
		},

		setData: function(key, value) {
			this.data[key] = value;
		},

		getData: function(key) {
			if (!this.data[key]) {
				console.log('No data found for key: %s'.red, key);
				console.log(this.data);
			}

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

		storeLocationAs: function(name, idx) {
			this.currentStep.storeLocationId = function() {
				if (this.response.headers.location) {
					var locationParts = this.response.headers.location.split('/');
					this.setData(name + 'Id' + idx, parseInt(locationParts[locationParts.length - 1]));
					this.setData('location' + s.capitalize(name) + idx, this.response.headers.location);
				}
				else {
					console.log('Unable to store the location as there is no location header.'.red);
				}
			};

			return this;
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
			addExpectation(this, function() {
				if (expectedCode != this.response.statusCode) {
					this.counters.failed++;
					console.log(testMessage('Expected status code: %s, received: %s').red, expectedCode, this.response.statusCode);
				}
				else {
					console.log(testMessage('Expected status code: %s').green, expectedCode);
				}
			});

			return this;
		},

		expectLocationHeader: function(locationPattern) {
			addExpectation(this, function() {
				// Check if the location header is present
				if (this.response.headers.location) {
					var locationParts = this.response.headers.location.split('/');
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
									this.counters.failed++;
									console.log(testMessage('Expected location pattern: %s does not match the location retrieved: %s').red, locationPattern, this.response.headers.location);
									break;
								}
							}

							// Check if the current part analyzed is regex pattern
							else if (s.startsWith(locationPatternParts[i], 'reg:')) {
								// Check the validity against the pattern
								if (new RegExp(locationPatternParts[i].split(':')[1], 'g').test(locationParts[i])) {
									error = true;
									this.counters.failed++;
									console.log(testMessage('Expected location pattern: %s does not match the location retrieved: %s').red, locationPattern, this.response.headers.location);
									break;
								}
							}
							else {
								if (locationPatternParts[i] != locationParts[i]) {
									error = true;
									this.counters.failed++;
									console.log(testMessage('Expected location pattern: %s does not match the location retrieved: %s').red, locationPattern, response.headers.location);
									break;
								}
							}
						}

						if (!error) {
							console.log(testMessage('Expected location to be %s').green, this.response.headers.location);
						}
					}
					else {
						this.counters.failed++;
						console.log(testMessage('Expected location pattern: %s does not match the location retrieved: %s').red, locationPattern, response.headers.location);
					}
				}
				else {
					this.counters.failed++;
					console.log(testMessage('Expected to find location header but was not found.').red);
				}
			});

			return this;
		},

		expectJsonToHavePath: function(paths) {
			if (_.isString(paths)) {
				paths = [ paths ];
			}

			addExpectation(this, function() {
				_.each(paths, function(path) {
					var
						currentNode = this.response.body,
						currentPath = '',
						error = false,
						pathParts = path.split('.');

					for (var i = 0; i < pathParts.length; i++) {
						currentPath += '.' + pathParts[i];

						var key = pathParts[i];

						if ((_.isArray(currentNode) && !currentNode[key]) || !_.has(currentNode, key)) {
							error = true;
							console.log(testMessage('Expected to found path: %s, stopped at: %s, %s not found.').red, path, currentPath.substr(1), key);
							break;
						}

						currentNode = currentNode[key];
					}

					if (!error) {
						console.log(testMessage('Expected to found path: %s').green, path);
					}
					else {
						this.counters.failed++;
					}
				}, this);
			});

			return this;
		},

		expectJsonCollectionToHaveSize: function(expectedSize) {
			addExpectation(this, function() {
				// If not an array
				if (!_.isArray(this.response.body)) {
					this.counters.failed++;

					// If a string
					if (_.isString(this.response.body)) {
						console.log(testMessage('Expected a collection, received a string'.red));
					}
					else {
						console.log(testMessage('Expected a collection, received an object'.red));
					}
				}

				// Check size
				else if (this.response.body.length != expectedSize) {
					this.counters.failed++;
					console.log(testMessage('Expected a collection of size: %s, received a collection of size: %s'.red), expectedSize, this.response.body.length);
				}

				else {
					console.log(testMessage('Expected a collection of size: %s'.green), expectedSize);
				}
			});

			return this;
		},

		expectJsonToBe: function(expected) {
			addExpectation(this, function() {
				if (_.isString(this.response.body)) {
					this.counters.failed++;
					console.log(testMessage('Expected to have JSON body, but got: .' + this.response.body).red);
				}
				else {
					var realExpected = expected;
					if (_.isFunction(expected)) {
						realExpected = _.bind(expected, this)();
					}

					var res = compareExactJson(this.response.body, realExpected);

					if (res) {
						this.counters.failed++;
						console.log(testMessage('Expected JSON to be the same.').red);
						printJsonErrorObject(res, 3);
					}
					else {
						console.log(testMessage('Expected JSON to be the same.').green);
					}
				}
			});

			return this;
		},

		expectJsonToBeAtLeast: function(expected) {
			addExpectation(this, function() {
				if (_.isString(this.response.body)) {
					this.counters.failed++;
					console.log(testMessage('Expected to have JSON body, got: ' + this.response.body).red);
				}
				else {
					var realExpected = expected;
					if (_.isFunction(expected)) {
						realExpected = _.bind(expected, this)();
					}

					var res = compareContentJson(this.response.body, realExpected);

					if (res) {
						this.counters.failed++;
						console.log(testMessage('Expected JSON to contain at least.').red);
						printJsonErrorObject(res, 3);
					}
					else {
						console.log(testMessage('Expected JSON to contain at least.').green);
					}
				}
			});

			return this;
		},

		expectMockServerToHaveReceived: function(expected) {
			addExpectation(this, function() {
				var realExpected = expected;
				if (_.isFunction(expected)) {
					realExpected = _.bind(expected, this)();
				}

				return this.mockServerClient
					.verify(realExpected)
					.then(function() {
						console.log(testMessage('Expected Mock Server to have received request.').green);
					})
					.catch(function(err) {
						console.log(testMessage('Expected Mock Server to have received request but not received.').red);
					});
			});

			return this;
		},

		after: function(fn) {
			this.afters.push(fn);

			return this;
		},

		run: function(promise, options) {
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

				// If mock request is present
				if (step.mockRequest) {
					promise = promise.then(function() {
						this.mockServerClient.mockAnyResponse(step.mockRequest);
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

							if (step.storeLocationId) {
								_.bind(step.storeLocationId, this)();
							}
						});
				});

				// Prepare expectation steps
				_.each(step.expectations, function(expectation) {
					promise = promise.then(expectation);
				});

				// Print the response in light/heavy mode
				if (step.printResponse) {
					promise = promise.then(function() {
						console.log("################# RESPONSE ###############".magenta);
						if (!step.printResponse.body) {
							console.log(this.response.headers);
						}

						if (this.response.body) {
							console.log(this.response.body);
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

			if (options && options.counters) {
				promise = promise.then(function() {
					options.counters.expectations += this.counters.expectations;
					options.counters.failed += this.counters.failed;
				});
			}

			// Catch all
			promise = promise.catch(function(err) {
				console.log("something went wrong".red);

				if (err) {
					console.log(err);
					if (err.stack) {
						console.log(err.stack);
					}
				}
			});

			return promise;
		}
	};
};