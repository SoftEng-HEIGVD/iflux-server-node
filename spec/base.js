var
	_ = require('underscore'),
	testFactory = require('./test'),
	config = require('../config/config');

module.exports = function(name) {
	var test = testFactory(name);

	test
		.baseUrl('http://' + config.host + ':' + config.port)
		.setJson();

	return _.extend(test, {
		createUser: function(label, data) {
			return this
				.describe(label)
				.post	({
					url: '/v1/auth/register',
					body: _.extend({
						firstName: 'Henri',
						lastName: 'Dupont',
						email: 'henri.dupont@localhost.localdomain',
						password: 'password',
						passwordConfirmation: 'password'
					}, data || {})
				})
				.expectStatusCode(201);
		},

		signinUser: function(label, data, tokenName) {
			return this
				.describe(label)
				.post({
					url: '/v1/auth/signin',
					body: _.extend({
						email: 'henri.dupont@localhost.localdomain',
						password: 'password'
					}, data || {}),
					_storeData: function() { this.setData(tokenName || 'token1', this.response.body.token); }
				})
				.expectStatusCode(200);
		},

		createOrganization: function(label, data, tokenKey, locationKey) {
			return this
				.describe(label)
				.jwtAuthentication(function() { return this.getData(tokenKey); })
				.post({
					url: '/v1/organizations',
					body: _.extend({
						name: 'iFLUX'
					}, data || {}),
					_storeData: function() {
						var locationParts = this.response.headers.location.split('/');
						this.setData(locationKey + 'Id', locationParts[locationParts.length - 1]);
						this.setData(locationKey, this.response.headers.location);
					}
				})
				.expectStatusCode(201);
		}
	});
};