var
	_ = require('underscore'),
	copilot = require('api-copilot'),
	utils = require('./utils');

var scenario = new copilot.Scenario({
  name: 'Authentication resource',
	defaultRequestOptions: {
		json: true
	}
});

scenario
	.step('configure base URL', function() {
		return this.configure({
			baseUrl: 'http://localhost:' + require('../config/config').port
		});
	})

	.step('user does not exist and cannot signin', function() {
		return this.post({
			url: '/v1/auth/signin',
			body: {
				email: 'henri.dupont@localhost.localdomain',
				password: 'password'
			}
		});
	})

	.step('check: user does not exist and cannot signin', function(response) {
		utils.statusCode(response, 401);
	})

	.step('register user', function() {
		return this.post({
			url: '/v1/auth/register',
			body: {
				email: 'henri.dupont@localhost.localdomain',
				firstName: 'Henri',
				lastName: 'Dupont',
				password: 'password',
				passwordConfirmation: 'password'
			}
		});
	})

	.step('check: register user', function(response) {
		utils.statusCode(response, 201);
		utils.headers(response, {
			location: '/v1/me'
		});
	})

	.step('valid authentication', function() {
		return this.post({
			url: '/v1/auth/signin',
			body: {
				email: 'henri.dupont@localhost.localdomain',
				password: 'password'
			}
		});
	})

	.step('check: valid authentication', function(response) {
		utils.statusCode(response, 200);
	})

	.step('check errors', function() {
		if (utils.errors.length > 0) {
			_.each(utils.errors, function(error) {
				console.log(error.message);
				console.log(error.response.headers);
				console.log(error.response.body);
			});

			return this.fail('tests failed!');
		}
	});

module.exports = scenario;