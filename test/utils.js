var
	_ = require('underscore'),
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
	}
}