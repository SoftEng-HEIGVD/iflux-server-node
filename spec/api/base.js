var
	_ = require('underscore'),
	testFactory = require('./test'),
	config = require('../../config/config');

module.exports = function(name) {
	var keys = _.reduce(['token', 'organization', 'eventSourceTemplate', 'eventType', 'eventSource', 'actionTargetTemplate', 'actionType', 'actionTarget'], function(memo, value) {
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
			this.setData(regenerateKey(key, { suffix: 'Id' }), parseInt(locationParts[locationParts.length - 1]));
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
					};
				})
				.expectStatusCode(201);
		},

		createEventSource: function(label, data, tokenIdx, organizationIdx, templateIdx) {
			var realData = _.extend({
				name: 'iFLUX thermometer'
			}, data || {});

			return this
				.describe(label)
				.jwtAuthentication(function() { return this.getData(buildKey('token', tokenIdx)); })
				.post({
					url: '/v1/eventSources',
					_storeData: storageFactory('eventSource')
				},
				function() {
					return {
						body: _.extend(realData, {
							organizationId: this.getData(buildKey('organization', organizationIdx, { suffix: 'Id' })),
							eventSourceTemplateId: this.getData(buildKey('eventSourceTemplate', templateIdx, { suffix: 'Id' }))
						})
					};
				})
			.expectStatusCode(201);
		},

		createEventType: function(label, data, tokenIdx, templateIdx) {
			var realData = _.extend({
				name: 'Temperature Increase',
				description: 'Represent an increase in the temperature.',
				type: 'http://iflux.io/schemas/eventTypes',
				schema: {}
			}, data || {});

			return this
				.describe(label)
				.jwtAuthentication(function() { return this.getData(buildKey('token', tokenIdx)); })
				.post({
					url: '/v1/eventTypes',
					_storeData: storageFactory('eventType')
				},
				function() {
					return {
						body: _.extend(realData, {
							eventSourceTemplateId: this.getData(buildKey('eventSourceTemplate', templateIdx, { suffix: 'Id' }))
						})
					};
				})
				.expectStatusCode(201);
		},

		createActionTargetTemplate: function(label, data, tokenIdx, organizationIdx) {
			var realData = _.extend({
				name: 'Public iFLUX Radiator',
				public: true,
				target: {
					url: 'http://radiator.localhost.locadomain',
					token: 'token'
				}
			}, data || {});

			return this
				.describe(label)
				.jwtAuthentication(function() { return this.getData(buildKey('token', tokenIdx)); })
				.post({
					url: '/v1/actionTargetTemplates',
					_storeData: storageFactory('actionTargetTemplate')
				},
				function() {
					return {
						body: _.extend(realData, {
							organizationId: this.getData(buildKey('organization', organizationIdx, { suffix: 'Id' }))
						})
					};
				})
				.expectStatusCode(201);
		},

		createActionTarget: function(label, data, tokenIdx, organizationIdx, templateIdx) {
			var realData = _.extend({
				name: 'iFLUX radiator'
			}, data || {});

			return this
				.describe(label)
				.jwtAuthentication(function() { return this.getData(buildKey('token', tokenIdx)); })
				.post({
					url: '/v1/actionTargets',
					_storeData: storageFactory('actionTarget')
				},
				function() {
					return {
						body: _.extend(realData, {
							organizationId: this.getData(buildKey('organization', organizationIdx, { suffix: 'Id' })),
							actionTargetTemplateId: this.getData(buildKey('actionTargetTemplate', templateIdx, { suffix: 'Id' }))
						})
					};
				})
			.expectStatusCode(201);
		},

		createActionType: function(label, data, tokenIdx, templateIdx) {
			var realData = _.extend({
				name: 'Decrease thermostat',
				description: 'Action to reduce the thermostat.',
				type: 'http://iflux.io/schemas/actionTypes',
				schema: {}
			}, data || {});

			return this
				.describe(label)
				.jwtAuthentication(function() { return this.getData(buildKey('token', tokenIdx)); })
				.post({
					url: '/v1/actionTypes',
					_storeData: storageFactory('actionType')
				},
				function() {
					return {
						body: _.extend(realData, {
							actionTargetTemplateId: this.getData(buildKey('actionTargetTemplate', templateIdx, { suffix: 'Id' }))
						})
					};
				})
				.expectStatusCode(201);
		}
	});
};