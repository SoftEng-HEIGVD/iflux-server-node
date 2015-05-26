var
	_ = require('underscore'),
	testFactory = require('./test'),
	config = require('../config/config');

module.exports = function(name) {
	var keys = _.reduce(['token', 'organization', 'eventSourceTemplate'], function(memo, value) {
		memo[value] = {
			name: value,
			count: 0
		};

		return memo;
	}, {});

	function generateKey(name, options) {
		keys[name].count++;
		return (options && options.prefix ? options.prefix : '') + keys[name].name + (options && options.suffix ? options.suffix : '') + keys[name].count;
	}

	function regenerateKey(name, options) {
		return (options && options.prefix ? options.prefix : '') + keys[name].name + (options && options.suffix ? options.suffix : '') + keys[name].count;
	}

	function buildKey(name, idx, options) {
		return (options && options.prefix ? options.prefix : '') + keys[name].name + (options && options.suffix ? options.suffix : '') + idx;
	}

	function storageFactory(key) {
		return function() {
			this.setData(generateKey(key, { prefix: 'location' }), this.response.headers.location);
			var locationParts = this.response.headers.location.split('/');
			this.setData(regenerateKey(key, { suffix: 'Id' }), locationParts[locationParts.length - 1]);
		};
	}

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

		signinUser: function(label, data) {
			return this
				.describe(label)
				.post({
					url: '/v1/auth/signin',
					body: _.extend({
						email: 'henri.dupont@localhost.localdomain',
						password: 'password'
					}, data || {}),
					_storeData: function() {
						this.setData(generateKey('token'), this.response.body.token);
					}
				})
				.expectStatusCode(200);
		},

		createOrganization: function(label, data, tokenIdx) {
			return this
				.describe(label)
				.jwtAuthentication(function() { return this.getData(buildKey('token', tokenIdx)); })
				.post({
					url: '/v1/organizations',
					body: _.extend({
						name: 'iFLUX'
					}, data || {}),
					_storeData: storageFactory('organization')
				})
				.expectStatusCode(201);
		},

		createEventSourceTemplate: function(label, data, tokenIdx, organizationIdx) {
			var realData = _.extend({
				name: 'Public iFLUX Thermometer',
				public: true
			}, data || {});

			return this
				.describe(label)
				.jwtAuthentication(function() { return this.getData(buildKey('token', tokenIdx)); })
				.post({
					url: '/v1/eventSourceTemplates',
					_storeData: storageFactory('eventSourceTemplate')
				},
				function() {
					return {
						body: _.extend(realData, {
							organizationId: this.getData(buildKey('organization', organizationIdx, { suffix: 'Id' }))
						})
					}
				})
				.expectStatusCode(201);
		}
	});
};