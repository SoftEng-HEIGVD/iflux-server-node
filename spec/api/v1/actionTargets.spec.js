var
	config = require('../../../config/config'),
	baseTest = require('../base');

module.exports = baseTest('Action target resource')
	.createUser('Register first user')
	.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })
	.signinUser('Signing first user')
	.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' })
	.createOrganization('Create new organization for first user', { name: 'Orga 1' }, 1, 1)
	.createOrganization('Create second organization for first user', { name: 'Orga 2' }, 1, 2)
	.createOrganization('Create new organization for second user', { name: 'Orga 3' }, 2, 3)
	.createActionTargetTemplate('Create first action target template for first user', {
		name: 'Action target template 1',
		public: true,
		configuration: {
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					botId: {
						type: "string"
					}
				},
				"additionalProperties": false,
				"required": [ "botId" ]
			}
		}
	}, 1, 1 )
	.createActionTargetTemplate('Create second action target template for first user', { name: 'Action target template 2', public: false }, 1, 2 )
	.createActionTargetTemplate('Create first action target template for second user', { name: 'Action target template 3', public: false }, 2, 3 )

	.createActionTargetTemplate('Create action target template with url for first user', {
		name: 'Action target template with url',
		public: true,
		configuration: {
			url: 'http://localhost:' + config.mockServer.serverPort + '/configure',
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					test: {
						type: "string"
					}
				},
				"additionalProperties": false,
				"required": [ "test" ]
			}
		}
	}, 1, 1 )

	.createActionTargetTemplate('Create action target template with url and token for first user', {
		name: 'Action target template with url and token',
		public: true,
		configuration: {
			url: 'http://localhost:' + config.mockServer.serverPort + '/configure',
			token: 'jwtToken',
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					test: {
						type: "string"
					}
				},
				"additionalProperties": false,
				"required": [ "test" ]
			}
		}
	}, 1, 1 )

	.describe('First user tries to creates AT1 action target with too short name.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('name.0')
	.expectJsonToBe({ name: [ 'The name must be at least 3 characters long' ]})

	.describe('First user tries to creates AT1 action target in an organization he has no access.')
	.post({	url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT1',
				organizationId: this.getData('organizationId3'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId3')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('organizationId.0')
	.expectJsonToBe({ organizationId: [ 'No organization found.' ]})

	.describe('First user tries to create AT1 action target from an action target template he has no access.')
	.post({	url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT1',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId3')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('actionTargetTemplateId.0')
	.expectJsonToBe({ actionTargetTemplateId: [ 'No action target template found.' ]})

	.describe('First user tries to create AT1 action target with a wrong configuration.')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT1',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
				configuration: {
					wrongProperty: 'anyValue'
				}
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('configuration')
	.expectJsonToBe({ configuration: [{
		wrongProperty: [ "additionalProperty 'wrongProperty' exists in instance when not allowed" ],
		botId: [ "requires property \"botId\"" ]
	}]})

	.describe('First user creates a AT1 action target for his second organization and first action target template.')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT1',
				organizationId: this.getData('organizationId2'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
				configuration: {
					botId: 'amazingSensor'
				}
			}
		};
	})
	.storeLocationAs('actionTarget', 1)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user tries to re-create AT1 action target.')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT1',
				organizationId: this.getData('organizationId2'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
				configuration: {
					botId: 'amazingSensor'
				}
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('name')
	.expectJsonToBe({ name: [ "Name is already taken for this action target template and this organization." ] })

	.describe('First user tries to re-create AT1 action target but in a different action target template template.')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT1',
				organizationId: this.getData('organizationId2'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId2')
			}
		};
	})
	.storeLocationAs('actionTarget', 100)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user tries to re-create AT1 action target but in a different organization.')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT1',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1')
			}
		};
	})
	.storeLocationAs('actionTarget', 101)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user creates AT2 action target for his second organization and second action target template.')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT2',
				organizationId: this.getData('organizationId2'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId2')
			}
		};
	})
	.storeLocationAs('actionTarget', 2)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')

	.describe('First user tries to create AT3  action target for his first organization and second action target template.')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT3',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId2')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('actionTargetTemplateId.0')
	.expectJsonToBe({ actionTargetTemplateId: [ 'No action target template found.' ]})

	.describe('First user creates AT3 action target for his first organization and first action target template.')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT3',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1')
			}
		};
	})
	.storeLocationAs('actionTarget', 3)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')

	.describe('Second user creates AT4 action target for his organization and first action target template.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT4',
				organizationId: this.getData('organizationId3'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1')
			}
		};
	})
	.storeLocationAs('actionTarget', 4)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')

	.describe('Second user creates AT5 action target for his organization and third action target template.')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT5',
				organizationId: this.getData('organizationId3'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId3')
			}
		};
	})
	.storeLocationAs('actionTarget', 5)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')

	.describe('Second user creates AT6 action target for his organization and template in a different organization.')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT6',
				organizationId: this.getData('organizationId3'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1')
			}
		};
	})
	.storeLocationAs('actionTarget', 6)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')

	.describe('Second user retrieve AT6 action target.')
	.get({}, function() { return { url: '/v1/actionTargets?name=%6&actionTargetTemplateId=' + this.getData('actionTargetTemplateId1') }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'AT6',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user tries to retrieve action targets.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({ url: '/v1/actionTargets' })
	.expectStatusCode(422)
	.expectJsonToHavePath([ 'actionTargetTemplateId', 'organizationId', 'allOrganizations' ])
	.expectJsonToBe({
		actionTargetTemplateId: [ 'Action target template id should be provided.' ],
		organizationId: [ 'Organization id should be provided.' ],
		allOrganizations: [ 'allOrganizations should be provided.' ]
	})

	.describe('First user tries to mix different way to retrieve action targets (actionTargetTemplateId is used).')
	.get({}, function() {
		return {
			url: '/v1/actionTargets?allOrganizations&organizationId=' +
				this.getData('organizationId1') +
				'&actionTargetTemplateId=' +
				this.getData('actionTargetTemplateId1')
		};
	})
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId1'),
			name: 'AT1',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}, {
			id: this.getData('actionTargetId3'),
			name: 'AT3',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}, {
			id: this.getData('actionTargetId101'),
			name: 'AT1',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user tries to mix different way to retrieve action targets (organizationId is used).')
	.get({}, function() { return { url: '/v1/actionTargets?allOrganizations&organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId3'),
			name: 'AT3',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}, {
			id: this.getData('actionTargetId101'),
			name: 'AT1',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action targets.')
	.get({ url: '/v1/actionTargets?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '2.id', '0.name', '1.name', '2.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(5)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId1'),
			name: 'AT1',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
			configuration: { botId: 'amazingSensor' }
		}, {
			id: this.getData('actionTargetId2'),
			name: 'AT2',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}, {
			id: this.getData('actionTargetId3'),
			name: 'AT3',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}, {
			id: this.getData('actionTargetId100'),
			name: 'AT1',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}, {
			id: this.getData('actionTargetId101'),
			name: 'AT1',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action targets filtered by name.')
	.get({ url: '/v1/actionTargets?allOrganizations&name=AT1' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId1'),
			name: 'AT1',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
			configuration: { botId: 'amazingSensor' }
		}, {
			id: this.getData('actionTargetId100'),
			name: 'AT1',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}, {
			id: this.getData('actionTargetId101'),
			name: 'AT1',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action targets for his first organization.')
	.get({}, function() { return { url: '/v1/actionTargets?organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId3'),
			name: 'AT3',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}, {
			id: this.getData('actionTargetId101'),
			name: 'AT1',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action targets for his second organization.')
	.get({}, function() { return { url: '/v1/actionTargets?organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId1'),
			name: 'AT1',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
			configuration: {
				botId: 'amazingSensor'
			}
		}, {
			id: this.getData('actionTargetId2'),
			name: 'AT2',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}, {
			id: this.getData('actionTargetId100'),
			name: 'AT1',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}];
	})

	.describe('First user retrieves all action targets for his second organization filtered by name.')
	.get({}, function() { return { url: '/v1/actionTargets?organizationId=' + this.getData('organizationId2') + '&name=%2'}; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId2'),
			name: 'AT2',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}];
	})

	.describe('First user retrieves all action targets for his first action target template.')
	.get({}, function() { return { url: '/v1/actionTargets?actionTargetTemplateId=' + this.getData('actionTargetTemplateId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId1'),
			name: 'AT1',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
			configuration: {
				botId: 'amazingSensor'
			}
		}, {
			id: this.getData('actionTargetId3'),
			name: 'AT3',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}, {
			id: this.getData('actionTargetId101'),
			name: 'AT1',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action targets for his first action target template filtered by name.')
	.get({}, function() { return { url: '/v1/actionTargets?actionTargetTemplateId=' + this.getData('actionTargetTemplateId1') + '&name=%3'}; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId3'),
			name: 'AT3',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action targets for his second action target template.')
	.get({}, function() { return { url: '/v1/actionTargets?actionTargetTemplateId=' + this.getData('actionTargetTemplateId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId2'),
			name: 'AT2',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}, {
			id: this.getData('actionTargetId100'),
			name: 'AT1',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}];
	})

	.describe('Second user retrieves all action targets.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({ url: '/v1/actionTargets?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId4'),
			name: 'AT4',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}, {
			id: this.getData('actionTargetId5'),
			name: 'AT5',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId3')
		}, {
			id: this.getData('actionTargetId6'),
			name: 'AT6',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('Second user retrieves all action targets for his organization.')
	.get({}, function() { return { url: '/v1/actionTargets?organizationId=' + this.getData('organizationId3') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId4'),
			name: 'AT4',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}, {
			id: this.getData('actionTargetId5'),
			name: 'AT5',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId3')
		}, {
			id: this.getData('actionTargetId6'),
			name: 'AT6',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('Second user retrieves all action targets for his action target template.')
	.get({}, function() { return { url: '/v1/actionTargets?actionTargetTemplateId=' + this.getData('actionTargetTemplateId3') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.actionTargetId', '0.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId5'),
			name: 'AT5',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId3')
		}];
	})

	.describe('First user tries to retrieve an action target that does not exist.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: this.getData('locationActionTarget1') + '100' }; })
	.expectStatusCode(403)

	.describe('First user tries to retrieve an action target from an organization where he is not a member.')
	.get({}, function() { return { url: this.getData('locationActionTarget4') }; })
	.expectStatusCode(403)

	.describe('First user retrieve his first action target.')
	.get({}, function() { return { url: this.getData('locationActionTarget1') }; })
	.expectStatusCode(200)
	.expectJsonToBeAtLeast(function() {
		return {
			id: this.getData('actionTargetId1'),
			name: 'AT1',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
			configuration: {
				botId: 'amazingSensor'
			}
		};
	})

	.describe('First user updates AT1 action target.')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTarget1'),
			body: {
				name: 'AT1 renamed'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('AT1 not updated should let it unchanged.')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTarget1'),
			body: {}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/actionTargets/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates the configuration of AT1 action target.')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTarget1'),
			body: {
				configuration: {
					botId: 'SuperBot'
				}
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('Check AT1 action target has been correctly updated.')
	.get({}, function() {
		return {
			url: this.getData('locationActionTarget1')
		};
	})
	.expectStatusCode(200)
	.expectJsonToBeAtLeast({
		name: 'AT1 renamed',
		configuration: {
			botId: 'SuperBot'
		}
	})

	.describe('First user updates AT1 (100) action target with a name used by AT2.')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTarget100'),
			body: {
				name: 'AT2'
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ name: [ 'Name is already taken for this action target template and this organization.' ]})
	.noAfter()

	.describe('First user updates AT1 (100) action target with a name used by AT3.')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTarget100'),
			body: {
				name: 'AT3'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates AT1 (100) action target with a name used by AT1 (1).')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTarget100'),
			body: {
				name: 'AT1 renamed'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('Second user tries to update AT1 action target of first user.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({}, function() {
		return {
			url: this.getData('locationActionTarget1'),
			body: {
				name: 'AT1 renamed again'
			}
		};
	})
	.expectStatusCode(403)

	.describe('First user creates AT7 action target with a configuration call to remote system.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.mockRequest({
		method: 'POST',
		path: '/configure',
		body: {
			type: 'JSON'
		}
	}, {
		statusCode: 200,
		body: {
			type: 'JSON',
			value: JSON.stringify({ message: 'Configuration done.' })
		}
	}, {
		remainingTimes: 1,
		unlimited: 1
	})
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT7',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId4'),
				configuration: {
					test: 'niceStoryBro'
				}
			}
		};
	})
	.storeLocationAs('actionTarget', 200)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')
	.expectMockServerToHaveReceived(function() {
		return {
			method: 'POST',
			path: '/configure',
			body: {
				type: 'JSON',
				matchType: 'ONLY_MATCHING_FIELDS',
				value: JSON.stringify({
					properties: {
						test: 'niceStoryBro'
					}
				})
			}
		};
	})

	.describe('First user creates AT8 action target with a configuration and a token call to remote system.')
	.mockRequest({
		method: 'POST',
		path: '/configure',
		body: {
			type: 'JSON'
		}
	}, {
		statusCode: 200,
		body: {
			type: 'JSON',
			value: JSON.stringify({ message: 'Configuration done.' })
		}
	}, {
		remainingTimes: 1,
		unlimited: 1
	})
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT8',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId5'),
				configuration: {
					test: 'niceStoryBro'
				}
			}
		};
	})
	.storeLocationAs('actionTarget', 201)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')
	.expectMockServerToHaveReceived(function() {
		return {
			method: 'POST',
			path: '/configure',
			headers: [{
				name: 'Authorization',
				values: [ 'bearer jwtToken' ]
			}],
			body: {
				type: 'JSON',
				matchType: 'ONLY_MATCHING_FIELDS',
				value: JSON.stringify({
					properties: {
						test: 'niceStoryBro'
					}
				})
			}
		};
	})

	.describe('First user reconfigure AT8 action target.')
	.mockRequest({
		method: 'POST',
		path: '/configure',
		body: {
			type: 'JSON'
		}
	}, {
		statusCode: 200,
		body: {
			type: 'JSON',
			value: JSON.stringify({ message: 'Configuration done.' })
		}
	}, {
		remainingTimes: 1,
		unlimited: 1
	})
	.post({}, function() {
		return {
			url: this.getData('locationActionTarget201') + '/configure'
		};
	})
	.expectStatusCode(200)
	.expectMockServerToHaveReceived(function() {
		return {
			method: 'POST',
			path: '/configure',
			headers: [{
				name: 'Authorization',
				values: [ 'bearer jwtToken' ]
			}],
			body: {
				type: 'JSON',
				matchType: 'ONLY_MATCHING_FIELDS',
				value: JSON.stringify({
					properties: {
						test: 'niceStoryBro'
					}
				})
			}
		};
	})

	.describe('First user tries to reconfigure AT2 action target that has no configuration.')
	.post({}, function() {
		return {
			url: this.getData('locationActionTarget2') + '/configure'
		};
	})
	.expectStatusCode(404)
;