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

	.describe('Create EST1 event source template in organization where user does not have access')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/eventSourceTemplates' }, function() {
		return {
			body: {
				name: 'EST1',
				public: true,
				organizationId: this.getData('organizationId3')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('organizationId.0')
	.expectJsonToBe({ organizationId: [ 'No organization found.' ]})

	.describe('Create EST1 (public) event source template for first user in his first organization')
	.post({ url: '/v1/eventSourceTemplates' }, function() {
		return {
			body: {
				name: 'EST1',
				public: true,
				organizationId: this.getData('organizationId1'),
				configuration: {
					schema: { test: true },
					url: 'http://somewhere.localhost.localdomain',
					token: 'sometoken'
				}
			}
		};
	})
	.storeLocationAs('eventSourceTemplate', 1)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceTemplates/:id')

	.describe('Try to re-create EST1 event source template for first user in his first organization')
	.post({ url: '/v1/eventSourceTemplates' }, function() {
		return {
			body: {
				name: 'EST1',
				public: true,
				organizationId: this.getData('organizationId1'),
				configuration: {
					schema: { test: true },
					url: 'http://somewhere.localhost.localdomain',
					token: 'sometoken'
				}
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ name: [ 'Name is already taken in this organization.' ]})

	.describe('Re-create EST1 (public) event source template for first user in his second organization')
	.post({ url: '/v1/eventSourceTemplates' }, function() {
		return {
			body: {
				name: 'EST1',
				public: true,
				organizationId: this.getData('organizationId2')
			}
		};
	})
	.storeLocationAs('eventSourceTemplate', 100)
	.expectStatusCode(201)

	.describe('Create EST2 (private) event source template for first user in his first organization')
	.post({ url: '/v1/eventSourceTemplates' }, function() {
		return {
			body: {
				name: 'EST2',
				public: false,
				organizationId: this.getData('organizationId1')
			}
		};
	})
	.storeLocationAs('eventSourceTemplate', 2)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceTemplates/:id')

	.describe('Create EST3 (public) event source template for first user in his second organization')
	.post({ url: '/v1/eventSourceTemplates' }, function() {
		return {
			body: {
				name: 'EST3',
				public: true,
				organizationId: this.getData('organizationId2')
			}
		};
	})
	.storeLocationAs('eventSourceTemplate', 3)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceTemplates/:id')

	.describe('Create EST4 (public) event source template for second user in his organization')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({ url: '/v1/eventSourceTemplates' }, function() {
		return {
			body: {
				name: 'EST4',
				public: true,
				organizationId: this.getData('organizationId3')
			}
		};
	})
	.storeLocationAs('eventSourceTemplate', 4)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceTemplates/:id')

	.describe('Create EST5 (private) event source template for second user in his organization')
	.post({ url: '/v1/eventSourceTemplates' }, function() {
		return {
			body: {
				name: 'EST5',
				public: false,
				organizationId: this.getData('organizationId3')
			}
		};
	})
	.storeLocationAs('eventSourceTemplate', 5)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceTemplates/:id')

	.describe('Retrieve all the public event source templates for first user')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({ url: '/v1/eventSourceTemplates?public=true' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId', '1.id', '1.name', '1.public', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(4)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId1'),
			configuration: {
				schema: { test: true },
				url: 'http://somewhere.localhost.localdomain',
				token: 'sometoken'
			}
		}, {
			name: 'EST3',
			public: true,
			organizationId: this.getData('organizationId2')
		}, {
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId2')
		}, {
			name: 'EST4',
			public: true,
			organizationId: this.getData('organizationId3')
		}];
	})

	.describe('Retrieve all the public event source templates for first user filtered by name')
	.get({ url: '/v1/eventSourceTemplates?public=true&name=%4' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'EST4',
			public: true,
			organizationId: this.getData('organizationId3')
		}];
	})

	.describe('Retrieve all the event source templates for first user')
	.get({ url: '/v1/eventSourceTemplates?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '2.id', '0.name', '1.name', '2.name', '0.public', '1.public', '2.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(4)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'EST1',
			organizationId: this.getData('organizationId1'),
			public: true,
			configuration: {
				schema: { test: true },
				url: 'http://somewhere.localhost.localdomain',
				token: 'sometoken'
			}
		}, {
			name: 'EST2',
			public: false,
			organizationId: this.getData('organizationId1')
		}, {
			name: 'EST3',
			public: true,
			organizationId: this.getData('organizationId2')
		}, {
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId2')
		}];
	})

	.describe('Retrieve all the event source templates for first user filtered by name')
	.get({ url: '/v1/eventSourceTemplates?allOrganizations&name=%1' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId1'),
			configuration: {
				schema: {test: true},
				url: 'http://somewhere.localhost.localdomain',
				token: 'sometoken'
			}
		}, {
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId2')
		}];
	})

	.describe('Retrieve all the event source templates for first user for the first organization')
	.get({}, function() { return { url: '/v1/eventSourceTemplates?organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.public', '1.public', '0.organizationId', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId1'),
			configuration: {
				schema: {test: true},
				url: 'http://somewhere.localhost.localdomain',
				token: 'sometoken'
			}
		}, {
			name: 'EST2',
			public: false,
			organizationId: this.getData('organizationId1')
		}];
	})

	.describe('Retrieve all the event source templates for first user for the first organization filtered by name')
	.get({}, function() { return { url: '/v1/eventSourceTemplates?organizationId=' + this.getData('organizationId1') + '&name=%1' }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'EST1',
			public: true,
			configuration: {
				schema: { test: true },
				url: 'http://somewhere.localhost.localdomain',
				token: 'sometoken'
			}
		}];
	})

	.describe('Retrieve all the event source templates for first user for the second organization')
	.get({}, function() { return { url: '/v1/eventSourceTemplates?organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'EST3',
			public: true,
			organizationId: this.getData('organizationId2')
		}, {
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId2')
		}];
	})

	.describe('Retrieve all the event source templates for second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({ url: '/v1/eventSourceTemplates' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId', '1.id', '1.name', '1.public', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(5)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId1'),
			configuration: {
				schema: { test: true },
				url: 'http://somewhere.localhost.localdomain',
				token: 'sometoken'
			}
		}, {
			name: 'EST3',
			public: true,
			organizationId: this.getData('organizationId2')
		}, {
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId2')
		}, {
			name: 'EST4',
			public: true,
			organizationId: this.getData('organizationId3')
		}, {
			name: 'EST5',
			public: false,
			organizationId: this.getData('organizationId3')
		}];
	})

	.describe('Retrieve all the event source templates for second user filtered by name')
	.get({ url: '/v1/eventSourceTemplates?name=%1' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId1'),
			configuration: {
				schema: { test: true },
				url: 'http://somewhere.localhost.localdomain',
				token: 'sometoken'
			}
		}, {
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId2')
		}];
	})

	.describe('Retrieve all the public event source templates for second user')
	.get({ url: '/v1/eventSourceTemplates?public=true' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId', '1.id', '1.name', '1.public', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(4)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId1'),
			configuration: {
				schema: { test: true },
				url: 'http://somewhere.localhost.localdomain',
				token: 'sometoken'
			}
		}, {
			name: 'EST3',
			public: true,
			organizationId: this.getData('organizationId2')
		}, {
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId2')
		}, {
			name: 'EST4',
			public: true,
			organizationId: this.getData('organizationId3')
		}];
	})

	.describe('Retrieve all the public event source templates for second user filtered by name')
	.get({ url: '/v1/eventSourceTemplates?public=true&name=%1' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId1'),
			configuration: {
				schema: { test: true },
				url: 'http://somewhere.localhost.localdomain',
				token: 'sometoken'
			}
		}, {
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId2')
		}];
	})

	.describe('Try to retrieve all event source templates and all for a specific organization, only the specific organization is taken into account.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: '/v1/eventSourceTemplates?allOrganizations&organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'EST3',
			public: true,
			organizationId: this.getData('organizationId2')
		}, {
			name: 'EST1',
			public: true,
			organizationId: this.getData('organizationId2')
		}];
	})

	.describe('Try to retrieve event source templates where the user is not member of the organization')
	.get({}, function() { return { url: this.getData('locationEventSourceTemplate1') + '100' }; })
	.expectStatusCode(403)

	.describe('First user updates one of his event source template')
	.patch({}, function() {
		return {
			url: this.getData('locationEventSourceTemplate1'),
			body: {
				name: 'EST1 renamed'
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

	.describe('First user updates his first event source template with a name used for in the same organization.')
	.patch({}, function() {
		return {
			url: this.getData('locationEventSourceTemplate1'),
			body: {
				name: 'EST2'
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ name: [ 'Name is already taken in this organization.' ]})

	.describe('First user updates EST1 for the configuration part.')
	.patch({}, function() {
		return {
			url: this.getData('locationEventSourceTemplate1'),
			body: {
				configuration: {
					schema: {
						test: false
					},
					url: 'http://somewhere.localhost.localdomain/est1',
					token: 'sometokenThatIsDifferent'
				}
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceTemplates/:id')

	.describe('First user retrieves EST1 after updated for checks.')
	.get({}, function() {
		return {
			url: this.getData('locationEventSourceTemplate1')
		};
	})
	.expectStatusCode(200)
	.expectJsonToBe(function() {
		return {
			id: this.getData('eventSourceTemplateId1'),
			name: 'EST1 renamed',
			public: true,
			organizationId: this.getData('organizationId1'),
      deletable: true,
			configuration: {
				schema: {
					test: false
				},
				url: 'http://somewhere.localhost.localdomain/est1',
				token: 'sometokenThatIsDifferent'
			}
		};
	})

	.describe('Second user tries to update one of first user event source template')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({}, function() {
		return {
			url: this.getData('locationEventSourceTemplate1'),
			body: {
				name: 'EST1 renamed again'
			}
		};
	})
	.expectStatusCode(403)
;