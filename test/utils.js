var
	_ = require('underscore'),
	s = require('underscore.string'),
	colors = require('colors');

module.exports = {
	errors: [],

	reset: function() {
		this.errors = [];
	},

	collect: function(message, response) {
		var error = {
			message: message.red,
			response: response
		};

		this.errors.push(error);

		console.log(error.message);
	},

	statusCode: function(response, expectedCode) {
		if (response.statusCode != expectedCode) {
			this.collect('Expected status code: ' + expectedCode + ', received: ' + response.statusCode, response);
		}
	},

	size: function(response, expectedSize) {
		if (!_.isArray(response.body)) {
			if (_.isString(response.body)) {
				this.collect('Expected a collection, received a string', response);
			}
			else {
				this.collect('Expected a collection, received an object', response);
			}
		}
		else if (response.body.length != expectedSize) {
			this.collect(
				'Expected a collection of length: ' + expectedSize + ", received a collection of length: " + response.body.length,
				response
			);
		}
	},

	headers: function(response, expectedHeaders) {
		_.each(expectedHeaders, function(headerValue, headerName) {
			if (!response.headers[headerName]) {
				this.collect('Header ' + headerName + ' is not present.', response );
			}
			else if (response.headers[headerName] != expectedHeaders[headerName]) {
				this.collect(
					'Expected value for header ' + headerName + ' is ' + expectedHeaders[headerName] + ' but received ' + response.headers[headerName],
					response
				);
			}
		}, this);
	},

	checkLocation: function(response, locationPattern) {
		if (response.headers.location) {
			var locationParts = response.headers.location.split('/');
			var locationPatternParts = locationPattern.split('/');

			if (locationParts.length == locationPatternParts.length) {
				for (var i = 0; i < locationPatternParts.length; i++) {
					if (s.startsWith(locationPatternParts[i], ':id')) {
						if (!new RegExp('[1-9][0-9]*', 'g').test(locationParts[i])) {
							this.collect(
								'Expected location pattern: ' + locationPattern + ' does not match the location retrieved: ' + response.headers.location,
								response
							);
							break;
						}
					}
					else if (s.startsWith(locationPatternParts[i], 'reg:')) {
						if (new RegExp(locationPatternParts[i].split(':')[1], 'g').test(locationParts[i])) {
							this.collect(
								'Expected location pattern: ' + locationPattern + ' does not match the location retrieved: ' + response.headers.location,
								response
							);
							break;
						}
					}
					else {
						if (locationPatternParts[i] != locationParts[i]) {
							this.collect(
								'Expected location pattern: ' + locationPattern + ' does not match the location retrieved: ' + response.headers.location,
								response
							);
							break;
						}
					}
				}
			}
			else {
				this.collect(
					'Expected location pattern: ' + locationPattern + ' does not match the location retrieved: ' + response.headers.location,
					response
				);
			}
		}
		else {
			this.collect('Expected to find location header but was not found.');
		}
	},

	checkError: function(response, fieldName, expectedMessage) {
		if (response.body) {
			if (response.body[fieldName]) {
				var found = false;

				_.each(response.body[fieldName], function(errorMessage) {
					if (errorMessage == expectedMessage) {
						found = true;
					}
				});

				if (!found) {
					var str = '';

					_.each(response.body[fieldName], function (message) {
						str += '"' + message + '", ';
					});

					this.collect(
						'Expected field in error "' + fieldName + '" with error message: "' + expectedMessage +
						'", but error messages present: [ ' + str.substr(0, str.length - 2) + ' ].',
						response
					);
				}
			}
			else {
				this.collect('Expected field in error: ' + fieldName + ' to be present, none found.');
			}
		}
		else {
			this.collect('There is no error messages for this response.', response);
		}
	},

	extractLocationId: function(response) {
		var locationParts = response.headers.location.split('/');

		return locationParts[locationParts.length - 1];
	}
};