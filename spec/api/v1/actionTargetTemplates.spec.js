var  baseTest = require('../base');

module.exports = baseTest('Action target template resource')
	.createUser('Register first user')
	.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })
	.signinUser('Signing first user')
	.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' })
	.createOrganization('Create new organization for first user', { name: 'Orga 1' }, 1, 1)
	.createOrganization('Create second organization for first user', { name: 'Orga 2' }, 1, 2)
	.createOrganization('Create new organization for second user', { name: 'Orga 3' }, 2, 3)

	.describe('Create new action target template in organzation where user does not have access')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/actionTargetTemplates' }, function() {
		return {
			body: {
				name: 'iFLUX Radiator',
				public: true,
				organizationId: this.getData('organizationId3'),
				target: {
					url: 'http://radiator.localhost.locadomain',
					token: 'token'
				}
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('organizationId.0')
	.expectJsonToBe({ organizationId: [ 'No organization found.' ]})

	.describe('Create new public action target template for first user in his first organization')
	.post({
		url: '/v1/actionTargetTemplates',
		_storeData: function() { this.setData('locationActionTargetTemplate1', this.response.headers.location); }
	},
	function() {
		return {
			body: {
				name: 'Public iFLUX Radiator',
				public: true,
				organizationId: this.getData('organizationId1'),
				configuration: {
					schema: { test: true },
					url: 'http://radiator.localhost.locadomain',
					token: 'sometoken'
				},
				target: {
					url: 'http://radiator.localhost.locadomain',
					token: 'token'
				}
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetTemplates/:id')

	.describe('Create new private action target template for first user in his first organization')
	.post({
		url: '/v1/actionTargetTemplates',
		_storeData: function() { this.setData('locationActionTargetTemplate2', this.response.headers.location); }
	},
	function() {
		return {
			body: {
				name: 'Private iFLUX Radiator',
				public: false,
				organizationId: this.getData('organizationId1'),
				target: {
					url: 'http://radiator.localhost.locadomain',
					token: 'token'
				}
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetTemplates/:id')

	.describe('Create new public action target template for first user in his second organization')
	.post({
		url: '/v1/actionTargetTemplates',
		_storeData: function() { this.setData('locationActionTargetTemplate3', this.response.headers.location); }
	},
	function() {
		return {
			body: {
				name: 'Public iFLUX Radiator in other orga',
				public: true,
				organizationId: this.getData('organizationId2'),
				target: {
					url: 'http://radiator.localhost.locadomain',
					token: 'token'
				}
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetTemplates/:id')

	.describe('Retrieve all the action target templates for first user')
	.get({ url: '/v1/actionTargetTemplates?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '2.id', '0.name', '1.name', '2.name', '0.public', '1.public', '2.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast([{
		name: 'Public iFLUX Radiator',
		public: true,
		configuration: {
			schema: { test: true },
			url: 'http://radiator.localhost.locadomain',
			token: 'sometoken'
		},
		target: {
			url: 'http://radiator.localhost.locadomain',
			token: 'token'
		}
	}, {
		name: 'Private iFLUX Radiator',
		public: false,
		target: {
			url: 'http://radiator.localhost.locadomain',
			token: 'token'
		}
	}, {
		name: 'Public iFLUX Radiator in other orga',
		public: true,
		target: {
			url: 'http://radiator.localhost.locadomain',
			token: 'token'
		}
	}])

	.describe('Retrieve all the action target templates for first user for the first organization')
	.get({}, function() { return { url: '/v1/actionTargetTemplates?organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.public', '1.public', '0.organizationId', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast([{
		name: 'Public iFLUX Radiator',
		public: true,
		configuration: {
			schema: { test: true },
			url: 'http://radiator.localhost.locadomain',
			token: 'sometoken'
		},
		target: {
			url: 'http://radiator.localhost.locadomain',
			token: 'token'
		}
	}, {
		name: 'Private iFLUX Radiator',
		public: false,
		target: {
			url: 'http://radiator.localhost.locadomain',
			token: 'token'
		}
	}])

	.describe('Retrieve all the action target templates for first user for the second organization')
	.get({}, function() { return { url: '/v1/actionTargetTemplates?organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast([{
		name: 'Public iFLUX Radiator in other orga',
		public: true
	}])

	.describe('Retrieve all the action target templates for second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({ url: '/v1/actionTargetTemplates' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId', '1.id', '1.name', '1.public', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast([{
		name: 'Public iFLUX Radiator',
		public: true,
		configuration: {
			schema: { test: true },
			url: 'http://radiator.localhost.locadomain',
			token: 'sometoken'
		},
		target: {
			url: 'http://radiator.localhost.locadomain',
			token: 'token'
		}
	}, {
		name: 'Public iFLUX Radiator in other orga',
		public: true,
		target: {
			url: 'http://radiator.localhost.locadomain',
			token: 'token'
		}
	}])

	.describe('Try to retrieve action target templates where the user is not member of the organization')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: this.getData('locationActionTargetTemplate1') + '100' }; })
	.expectStatusCode(403)

	.describe('Try to retrieve all action target templates and all for a specific organization, only the specific organization is taken into account.')
	.get({}, function() { return { url: '/v1/actionTargetTemplates?allOrganizations&organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast([{
		name: 'Public iFLUX Radiator in other orga',
		public: true,
		target: {
			url: 'http://radiator.localhost.locadomain',
			token: 'token'
		}
	}])

	.describe('First user updates one of his action target template')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTargetTemplate1'),
			body: {
				name: 'Public iFLUX Radiator renamed'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetTemplates/:id')

	.describe('No update sent must let the resource unchanged')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTargetTemplate1'),
			body: {}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/actionTargetTemplates/:id')

	.describe('Second user tries to update one of first user action target template')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({}, function() {
		return {
			url: this.getData('locationActionTargetTemplate1'),
			body: {
				name: 'Public iFLUX Radiator renamed by second user'
			}
		};
	})
	.expectStatusCode(403)
;