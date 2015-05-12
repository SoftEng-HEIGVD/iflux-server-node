var  baseTest = require('../base');

module.exports = baseTest('Event source template resource')
	.createUser('Register first user')
	.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })
	.signinUser('Signing first user')
	.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' }, 'token2')
	.createOrganization('Create new organization for first user', { name: 'Orga 1' }, 'token1', 'locationOrganization1')
	.createOrganization('Create second organization for first user', { name: 'Orga 2' }, 'token1', 'locationOrganization2')
	.createOrganization('Create new organization for second user', { name: 'Orga 3' }, 'token2', 'locationOrganization3')

	.describe('Create new event source template in organzation where user does not have access')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/eventSourceTemplates' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer',
				public: true,
				organizationId: this.getData('locationOrganization3Id')
			}
		}
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
				organizationId: this.getData('locationOrganization1Id')
			}
		}
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
				organizationId: this.getData('locationOrganization1Id')
			}
		}
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
				organizationId: this.getData('locationOrganization2Id')
			}
		}
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
		public: true
	}, {
		name: 'Private iFLUX Thermometer',
		public: false
	}, {
		name: 'Public iFLUX Thermometer in other orga',
		public: true
	}])

	.describe('Retrieve all the event source templates for first user for the first organization')
	.get({}, function() { return { url: '/v1/eventSourceTemplates?organizationId=' + this.getData('locationOrganization1Id') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.public', '1.public', '0.organizationId', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast([{
		name: 'Public iFLUX Thermometer',
		public: true
	}, {
		name: 'Private iFLUX Thermometer',
		public: false
	}])

	.describe('Retrieve all the event source templates for first user for the second organization')
	.get({}, function() { return { url: '/v1/eventSourceTemplates?organizationId=' + this.getData('locationOrganization2Id') }; })
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
		public: true
	}, {
		name: 'Public iFLUX Thermometer in other orga',
		public: true
	}])

	.describe('Try to retrieve event source templates where the user is not member of the organization')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: this.getData('locationEventSourceTemplate1') + '100' }; })
	.expectStatusCode(403)
;