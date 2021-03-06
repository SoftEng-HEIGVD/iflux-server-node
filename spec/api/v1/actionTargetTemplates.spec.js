var  baseTest = require('../base');

var testSuite = baseTest('Action target template resource')
	.createUser('Register first user')
	.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })
	.signinUser('Signing first user')
	.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' })
	.createOrganization('Create new organization for first user', { name: 'Orga 1' }, 1, 1)
	.createOrganization('Create second organization for first user', { name: 'Orga 2' }, 1, 2)
	.createOrganization('Create new organization for second user', { name: 'Orga 3' }, 2, 3);

testSuite
  .describe('Create new action target template with too short name')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/actionTargetTemplates' }, function() {
		return {
			body: {
				name: 'AB',
				public: true,
				organizationId: this.getData('organizationId1'),
				target: {
					url: 'http://radiator.localhost.localdomain',
					token: 'token'
				}
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('name.0')
	.expectJsonToBe({ name: [ 'The name must be at least 3 characters long' ]});

testSuite
	.describe('Create ATT1 action target template in organization where user does not have access')
	.post({	url: '/v1/actionTargetTemplates' }, function() {
		return {
			body: {
				name: 'ATT1',
				public: true,
				organizationId: this.getData('organizationId3'),
				target: {
					url: 'http://radiator.localhost.localdomain',
					token: 'token'
				}
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('organizationId.0')
	.expectJsonToBe({ organizationId: [ 'No organization found.' ]});

testSuite
	.describe('Create ATT1 (public) action target template for first user in his first organization')
	.post({ url: '/v1/actionTargetTemplates' }, function() {
		return {
			body: {
				name: 'ATT1',
				public: true,
				organizationId: this.getData('organizationId1'),
				configuration: {
					schema: { test: true },
					url: 'http://radiator.localhost.localdomain',
					token: 'sometoken'
				},
				target: {
					url: 'http://radiator.localhost.localdomain',
					token: 'token'
				}
			}
		};
	})
	.storeLocationAs('actionTargetTemplate', 1)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetTemplates/:id');

testSuite
	.describe('Try to re-create ATT1 action target template for first user in his first organization')
	.post({ url: '/v1/actionTargetTemplates' },
	function() {
		return {
			body: {
				name: 'ATT1',
				public: true,
				organizationId: this.getData('organizationId1'),
				configuration: {
					schema: { test: true },
					url: 'http://radiator.localhost.localdomain',
					token: 'sometoken'
				},
				target: {
					url: 'http://radiator.localhost.localdomain',
					token: 'token'
				}
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ name: [ 'Name is already taken in this organization.' ]});

testSuite
	.describe('Re-create ATT1 action target template for first user in his second organization')
	.post({ url: '/v1/actionTargetTemplates' },
	function() {
		return {
			body: {
				name: 'ATT1',
				public: true,
				organizationId: this.getData('organizationId2'),
				target: {
					url: 'http://radiator.localhost.localdomain',
					token: 'token'
				}
			}
		};
	})
	.storeLocationAs('actionTargetTemplate', 100)
	.expectStatusCode(201);

testSuite
	.describe('Create ATT2 (private) action target template for first user in his first organization')
	.post({	url: '/v1/actionTargetTemplates' }, function() {
		return {
			body: {
				name: 'ATT2',
				public: false,
				organizationId: this.getData('organizationId1'),
				target: {
					url: 'http://radiator.localhost.localdomain',
					token: 'token'
				}
			}
		};
	})
	.storeLocationAs('actionTargetTemplate', 2)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetTemplates/:id');

testSuite
	.describe('Create ATT3 (public) action target template for first user in his second organization')
	.post({	url: '/v1/actionTargetTemplates' }, function() {
		return {
			body: {
				name: 'ATT3',
				public: true,
				organizationId: this.getData('organizationId2'),
				target: {
					url: 'http://radiator.localhost.localdomain',
					token: 'token'
				}
			}
		};
	})
	.storeLocationAs('actionTargetTemplate', 3)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetTemplates/:id');

testSuite
	.describe('Create ATT4 (public) action target template for second user in his organization')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({	url: '/v1/actionTargetTemplates' }, function() {
		return {
			body: {
				name: 'ATT4',
				public: true,
				organizationId: this.getData('organizationId3'),
				target: {
					url: 'http://radiator.localhost.localdomain',
					token: 'token'
				}
			}
		};
	})
	.storeLocationAs('actionTargetTemplate', 4)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetTemplates/:id');

testSuite
	.describe('Create ATT5 (private) action target template for second user in his organization')
	.post({	url: '/v1/actionTargetTemplates' }, function() {
		return {
			body: {
				name: 'ATT5',
				public: false,
				organizationId: this.getData('organizationId3'),
				target: {
					url: 'http://radiator.localhost.localdomain',
					token: 'token'
				}
			}
		};
	})
	.storeLocationAs('actionTargetTemplate', 5)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetTemplates/:id');

testSuite
	.describe('Retrieve all the public action target templates for first user')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({ url: '/v1/actionTargetTemplates?public' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId', '1.id', '1.name', '1.public', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(4)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ATT1',
			public: true,
			organizationId: this.getData('organizationId1'),
			configuration: {
				schema: { test: true },
				url: 'http://radiator.localhost.localdomain',
				token: 'sometoken'
			},
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT3',
			public: true,
			organizationId: this.getData('organizationId2'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT1',
			public: true,
			organizationId: this.getData('organizationId1'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT4',
			public: true,
			organizationId: this.getData('organizationId3'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}];
	});

testSuite
	.describe('Retrieve all the public action target templates for first user filtered by name')
	.get({ url: '/v1/actionTargetTemplates?public=true&name=%3' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ATT3',
			public: true,
			organizationId: this.getData('organizationId2'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}];
	});

testSuite
	.describe('Retrieve all the action target templates for first user')
	.get({ url: '/v1/actionTargetTemplates?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '2.id', '0.name', '1.name', '2.name', '0.public', '1.public', '2.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(4)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ATT1',
			public: true,
			organizationId: this.getData('organizationId1'),
			configuration: {
				schema: { test: true },
				url: 'http://radiator.localhost.localdomain',
				token: 'sometoken'
			},
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT2',
			public: false,
			organizationId: this.getData('organizationId1'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT3',
			public: true,
			organizationId: this.getData('organizationId2'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT1',
			public: true,
			organizationId: this.getData('organizationId2'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}];
	});

testSuite
	.describe('Retrieve all the action target templates for first user filtered by name')
	.get({ url: '/v1/actionTargetTemplates?allOrganizations&name=%1' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ATT1',
			public: true,
			organizationId: this.getData('organizationId1'),
			configuration: {
				schema: { test: true },
				url: 'http://radiator.localhost.localdomain',
				token: 'sometoken'
			},
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT1',
			public: true,
			organizationId: this.getData('organizationId2'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}];
	});

testSuite
	.describe('Retrieve all the action target templates for first user for the first organization')
	.get({}, function() { return { url: '/v1/actionTargetTemplates?organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.public', '1.public', '0.organizationId', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ATT1',
			public: true,
			organizationId: this.getData('organizationId1'),
			configuration: {
				schema: { test: true },
				url: 'http://radiator.localhost.localdomain',
				token: 'sometoken'
			},
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT2',
			public: false,
			organizationId: this.getData('organizationId1'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}];
	});

testSuite
	.describe('Retrieve all the action target templates for first user for the first organization filtered by name')
	.get({}, function() { return { url: '/v1/actionTargetTemplates?organizationId=' + this.getData('organizationId1') + '&name=%1'}; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ATT1',
			public: true,
			organizationId: this.getData('organizationId1'),
			configuration: {
				schema: { test: true },
				url: 'http://radiator.localhost.localdomain',
				token: 'sometoken'
			},
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}];
	});

testSuite
	.describe('Retrieve all the action target templates for first user for the second organization')
	.get({}, function() { return { url: '/v1/actionTargetTemplates?organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ATT3',
			organizationId: this.getData('organizationId2'),
			public: true
		}, {
			name: 'ATT1',
			public: true,
			organizationId: this.getData('organizationId2'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}];
	});

testSuite
	.describe('Retrieve all the action target templates for second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({ url: '/v1/actionTargetTemplates' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId', '1.id', '1.name', '1.public', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(5)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ATT1',
			public: true,
			organizationId: this.getData('organizationId1'),
			configuration: {
				schema: { test: true },
				url: 'http://radiator.localhost.localdomain',
				token: 'sometoken'
			},
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT3',
			public: true,
			organizationId: this.getData('organizationId2'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT1',
			public: true,
			organizationId: this.getData('organizationId1'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT4',
			public: true,
			organizationId: this.getData('organizationId3'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT5',
			public: false,
			organizationId: this.getData('organizationId3'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}];
	});

testSuite
	.describe('Retrieve all the action target templates for second user filtered by name')
	.get({ url: '/v1/actionTargetTemplates?name=%3' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ATT3',
			public: true,
			organizationId: this.getData('organizationId2'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}];
	});

testSuite
	.describe('Retrieve all the public action target templates for second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({ url: '/v1/actionTargetTemplates?public' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId', '1.id', '1.name', '1.public', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(4)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ATT1',
			public: true,
			organizationId: this.getData('organizationId1'),
			configuration: {
				schema: { test: true },
				url: 'http://radiator.localhost.localdomain',
				token: 'sometoken'
			},
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT3',
			public: true,
			organizationId: this.getData('organizationId2'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT1',
			public: true,
			organizationId: this.getData('organizationId1'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT4',
			public: true,
			organizationId: this.getData('organizationId3'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}];
	});

testSuite
	.describe('Retrieve all the public action target templates for second user filtered by name')
	.get({ url: '/v1/actionTargetTemplates?public=true&name=%3' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ATT3',
			public: true,
			organizationId: this.getData('organizationId2'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}];
	});

testSuite
	.describe('Try to retrieve all action target templates and all for a specific organization, only the specific organization is taken into account.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: '/v1/actionTargetTemplates?allOrganizations&organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ATT3',
			public: true,
			organizationId: this.getData('organizationId2'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}, {
			name: 'ATT1',
			public: true,
			organizationId: this.getData('organizationId2'),
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		}];
	});

testSuite
	.describe('First user retrieve a public action target template from an organization where he is not a member')
	.get({}, function() { return { url: this.getData('locationActionTargetTemplate4') }; })
	.expectStatusCode(200);

testSuite
	.describe('First user retrieve a private action target template from an organization where he is not a member')
	.get({}, function() { return { url: this.getData('locationActionTargetTemplate5') }; })
	.expectStatusCode(403);

testSuite
	.describe('Try to retrieve action target templates where the user is not member of the organization')
	.get({}, function() { return { url: this.getData('locationActionTargetTemplate1') + '100' }; })
	.expectStatusCode(403);

testSuite
	.describe('First user updates one of his action target template')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTargetTemplate1'),
			body: {
				name: 'ATT1 renamed'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetTemplates/:id');

testSuite
	.describe('No update sent must let the resource unchanged')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTargetTemplate1'),
			body: {}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/actionTargetTemplates/:id');

testSuite
	.describe('First user updates his first action target template with a name used for a different organization.')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTargetTemplate1'),
			body: {
				name: 'ATT3'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetTemplates/:id');

testSuite
	.describe('First user updates his first action target template with a name used for in the same organization.')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTargetTemplate1'),
			body: {
				name: 'ATT2'
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ name: [ 'Name is already taken in this organization.' ]});

testSuite
	.describe('First user updates ATT1 for the configuration part.')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTargetTemplate1'),
			body: {
				configuration: {
					schema: {
						test: false
					},
					url: 'http://radiator.localhost.localdomain/att1',
					token: 'sometokenThatIsDifferent'
				}
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetTemplates/:id');

testSuite
	.describe('First user retrieves ATT1 after updated for checks.')
	.get({}, function() {
		return {
			url: this.getData('locationActionTargetTemplate1')
		};
	})
	.expectStatusCode(200)
	.expectJsonToBe(function() {
		return {
			id: this.getData('actionTargetTemplateId1'),
			name: 'ATT3',
			public: true,
			organizationId: this.getData('organizationId1'),
      deletable: true,
			configuration: {
				schema: {
					test: false
				},
				url: 'http://radiator.localhost.localdomain/att1',
				token: 'sometokenThatIsDifferent'
			},
			target: {
				url: 'http://radiator.localhost.localdomain',
				token: 'token'
			}
		};
	});

testSuite
	.describe('Second user tries to update one of first user action target template')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({}, function() {
		return {
			url: this.getData('locationActionTargetTemplate1'),
			body: {
				name: 'ATT1 renamed again'
			}
		};
	})
	.expectStatusCode(403);

testSuite
  .describe('First user remove ATT1.')
  .jwtAuthentication(function() { return this.getData('token1'); })
 	.delete({}, function() { return { url: this.getData('locationActionTargetTemplate1') }; })
 	.expectStatusCode(204);

testSuite
 	.describe('First user tries to retrieve ATT1.')
 	.get({}, function() { return { url: this.getData('locationActionTargetTemplate1') }; })
 	.expectStatusCode(403);

testSuite
 	.describe('First user tries to delete ATT4 in an organization where he is not a member.')
 	.delete({}, function() { return { url: this.getData('locationActionTargetTemplate4') }; })
 	.expectStatusCode(403);

module.exports = testSuite;