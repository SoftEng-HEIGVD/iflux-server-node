var  baseTest = require('../base');

module.exports = baseTest('Event source template resource')
	.createUser('Register first user')
	.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })
	.signinUser('Signing first user')
	.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' })
	.createOrganization('Create new organization for first user', { name: 'Orga 1' }, 1, 1)
	.createOrganization('Create second organization for first user', { name: 'Orga 2' }, 1, 2)
	.createOrganization('Create new organization for second user', { name: 'Orga 3' }, 2, 3)

	.describe('Create new event source template with too short name')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/eventSourceTemplates' }, function() {
		return {
			body: {
				name: 'ES',
				public: true,
				organizationId: this.getData('organizationId1')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('name.0')
	.expectJsonToBe({ name: [ 'The name must be at least 3 characters long' ]})

	.describe('Create new event source template in organization where user does not have access')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/eventSourceTemplates' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer',
				public: true,
				organizationId: this.getData('organizationId3')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('organizationId.0')
	.expectJsonToBe({ organizationId: [ 'No organization found.' ]})

	.describe('Create new public event source template for first user in his first organization')
	.post({
		url: '/v1/eventSourceTemplates',
		_storeData: function() { this.setData('locationEventSourceTemplate1', this.response.headers.location); }
	},
	function() {
		return {
			body: {
				name: 'Public iFLUX Thermometer',
				public: true,
				organizationId: this.getData('organizationId1'),
				configuration: {
					schema: { test: true },
					url: 'http://somewhere.localhost.locadomain',
					token: 'sometoken'
				}
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceTemplates/:id')

	.describe('Create new private event source template for first user in his first organization')
	.post({
		url: '/v1/eventSourceTemplates',
		_storeData: function() { this.setData('locationEventSourceTemplate2', this.response.headers.location); }
	},
	function() {
		return {
			body: {
				name: 'Private iFLUX Thermometer',
				public: false,
				organizationId: this.getData('organizationId1')
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceTemplates/:id')

	.describe('Create new public event source template for first user in his second organization')
	.post({
		url: '/v1/eventSourceTemplates',
		_storeData: function() { this.setData('locationEventSourceTemplate3', this.response.headers.location); }
	},
	function() {
		return {
			body: {
				name: 'Public iFLUX Thermometer in other orga',
				public: true,
				organizationId: this.getData('organizationId2')
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceTemplates/:id')

	.describe('Retrieve all the event source templates for first user')
	.get({ url: '/v1/eventSourceTemplates?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '2.id', '0.name', '1.name', '2.name', '0.public', '1.public', '2.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast([{
		name: 'Public iFLUX Thermometer',
		public: true,
		configuration: {
			schema: { test: true },
			url: 'http://somewhere.localhost.locadomain',
			token: 'sometoken'
		}
	}, {
		name: 'Private iFLUX Thermometer',
		public: false
	}, {
		name: 'Public iFLUX Thermometer in other orga',
		public: true
	}])

	.describe('Retrieve all the event source templates for first user filtered by name')
	.get({ url: '/v1/eventSourceTemplates?allOrganizations&name=Public%' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast([{
		name: 'Public iFLUX Thermometer',
		public: true,
		configuration: {
			schema: { test: true },
			url: 'http://somewhere.localhost.locadomain',
			token: 'sometoken'
		}
	}, {
		name: 'Public iFLUX Thermometer in other orga',
		public: true
	}])

	.describe('Retrieve all the event source templates for first user for the first organization')
	.get({}, function() { return { url: '/v1/eventSourceTemplates?organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.public', '1.public', '0.organizationId', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast([{
		name: 'Public iFLUX Thermometer',
		public: true,
		configuration: {
			schema: { test: true },
			url: 'http://somewhere.localhost.locadomain',
			token: 'sometoken'
		}
	}, {
		name: 'Private iFLUX Thermometer',
		public: false
	}])

	.describe('Retrieve all the event source templates for first user for the first organization filtered by name')
	.get({}, function() { return { url: '/v1/eventSourceTemplates?organizationId=' + this.getData('organizationId1') + '&name=Public%' }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast([{
		name: 'Public iFLUX Thermometer',
		public: true,
		configuration: {
			schema: { test: true },
			url: 'http://somewhere.localhost.locadomain',
			token: 'sometoken'
		}
	}])

	.describe('Retrieve all the event source templates for first user for the second organization')
	.get({}, function() { return { url: '/v1/eventSourceTemplates?organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast([{
		name: 'Public iFLUX Thermometer in other orga',
		public: true
	}])

	.describe('Retrieve all the event source templates for second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({ url: '/v1/eventSourceTemplates' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId', '1.id', '1.name', '1.public', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast([{
		name: 'Public iFLUX Thermometer',
		public: true,
		configuration: {
			schema: { test: true },
			url: 'http://somewhere.localhost.locadomain',
			token: 'sometoken'
		}
	}, {
		name: 'Public iFLUX Thermometer in other orga',
		public: true
	}])

	.describe('Retrieve all the event source templates for second user filtered by name')
	.get({ url: '/v1/eventSourceTemplates?name=%25iFLUX Thermometer' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast([{
		name: 'Public iFLUX Thermometer',
		public: true,
		configuration: {
			schema: { test: true },
			url: 'http://somewhere.localhost.locadomain',
			token: 'sometoken'
		}
	}])

	.describe('Try to retrieve event source templates where the user is not member of the organization')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: this.getData('locationEventSourceTemplate1') + '100' }; })
	.expectStatusCode(403)

	.describe('Try to retrieve all event source templates and all for a specific organization, only the specific organization is taken into account.')
	.get({}, function() { return { url: '/v1/eventSourceTemplates?allOrganizations&organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast([{
		name: 'Public iFLUX Thermometer in other orga',
		public: true
	}])

	.describe('First user updates one of his event source template')
	.patch({}, function() {
		return {
			url: this.getData('locationEventSourceTemplate1'),
			body: {
				name: 'Public iFLUX Thermometer renamed'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceTemplates/:id')

	.describe('No update sent must let the resource unchanged')
	.patch({}, function() {
		return {
			url: this.getData('locationEventSourceTemplate1'),
			body: {}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/eventSourceTemplates/:id')

	.describe('Second user tries to update one of first user event source template')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({}, function() {
		return {
			url: this.getData('locationEventSourceTemplate1'),
			body: {
				name: 'Public iFLUX Thermometer renamed by second user'
			}
		};
	})
	.expectStatusCode(403)
;