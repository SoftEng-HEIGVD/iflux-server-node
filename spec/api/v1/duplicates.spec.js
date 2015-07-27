/**
 * This scenario covers a use case where an organization has more than one user. In this case, the SQL queries
 * to get the accessible models (action/event sources/targets/types (templates)) can return duplicated data.
 *
 * To fix this issue, the SQL queries are tuned to avoid the duplication of the data.
 *
 * Therefore, it requires a dedicated test coverage to make sure there is no regression. In fact, we create
 * several data in two different organizations. The first organization contains two users (this normally will produce
 * the duplicated data) and the second organization only one user.
 *
 * Once the data are created, we try to retrieve the collection called "accessible" which means all the models of
 * specific type (action target, event source, ...) that a user can retrieve. In other words, the models that are
 * linked to the organization where the user is a member or the models that are public.
 */

var baseTest = require('../base');

var testSuite = baseTest('Delete on resources');

testSuite
	.describe('Register U1')
	.post	({
		url: '/v1/auth/register',
		body: {
			email: 'henri.dupont@localhost.localdomain',
			firstName: 'Henri',
			lastName: 'Dupont',
			password: 'password',
			passwordConfirmation: 'password'
		}
	})
	.expectStatusCode(201);

testSuite
	.describe('Register U2')
	.post	({
		url: '/v1/auth/register',
		body: {
			email: 'henri.dutoit@localhost.localdomain',
			firstName: 'Henri',
			lastName: 'Dutoit',
			password: 'password',
			passwordConfirmation: 'password'
		}
	})
	.expectStatusCode(201);

testSuite
	.describe('Signin U1')
	.post({
		url: '/v1/auth/signin',
		body: {
			email: 'henri.dupont@localhost.localdomain',
			password: 'password'
		},
		_storeData: function() { this.setData('t1', this.response.body.token); }
	})
	.expectStatusCode(200);

testSuite
	.describe('Create Orga1')
	.jwtAuthentication(function() { return this.getData('t1'); })
	.post({
		url: '/v1/organizations',
		body: {
			name: 'Orga1'
		}
	})
	.storeLocationAs('organization', 1)
	.expectStatusCode(201);

testSuite
	.describe('U1 add U2 in Orga1')
	.post({}, function() {
		return {
			url: this.getData('locationOrganization1') + '/actions',
			body: {
				type: "addUser",
				email: "henri.dutoit@localhost.localdomain"
			}
		};
	})
	.expectStatusCode(200);

testSuite
	.describe('Create Orga2')
	.post({
		url: '/v1/organizations',
		body: {
			name: 'Orga2'
		}
	})
	.storeLocationAs('organization', 2)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates action target template ATT1 in Orga1')
	.post({ url: '/v1/actionTargetTemplates' }, function() {
		return {
			body: {
				name: 'ATT1',
				public: true,
				organizationId: this.getData('organizationId1'),
				target: {
					url: 'http://radiator.localhost.localdomain',
					token: 'token'
				}
			}
		};
	})
	.storeLocationAs('actionTargetTemplate', 1)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates action target template ATT2 in Orga2')
	.post({ url: '/v1/actionTargetTemplates' }, function() {
		return {
			body: {
				name: 'ATT2',
				public: true,
				organizationId: this.getData('organizationId2'),
				target: {
					url: 'http://radiator.localhost.localdomain',
					token: 'token'
				}
			}
		};
	})
	.storeLocationAs('actionTargetTemplate', 2)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates event source template EST1 in Orga1')
	.post({ url: '/v1/eventSourceTemplates' }, function() {
		return {
			body: {
				name: 'EST1',
				public: true,
				organizationId: this.getData('organizationId1')
			}
		};
	})
	.storeLocationAs('eventSourceTemplate', 1)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates event source template EST2 in Orga2')
	.post({ url: '/v1/eventSourceTemplates' }, function() {
		return {
			body: {
				name: 'EST2',
				public: true,
				organizationId: this.getData('organizationId2')
			}
		};
	})
	.storeLocationAs('eventSourceTemplate', 2)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates action target AT1 in Orga1')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT1',
        public: true,
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1')
			}
		};
	})
	.storeLocationAs('actionTarget', 1)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates action target AT2 in Orga2')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT2',
        public: true,
				organizationId: this.getData('organizationId2'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId2')
			}
		};
	})
	.storeLocationAs('actionTarget', 2)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates event source ES1 in Orga1')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES1',
        public: true,
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1')
			}
		};
	})
	.storeLocationAs('eventSource', 1)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates event source ES2 in Orga2')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES2',
        public: true,
				organizationId: this.getData('organizationId2'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId2')
			}
		};
	})
	.storeLocationAs('eventSource', 2)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates action type AT1 in Orga1')
	.post({ url: '/v1/actionTypes'}, function() {
		return {
			body: {
				name: 'AT1',
				description: 'Action to reduce the thermostat.',
				public: true,
				type: 'http://localhost.localdomain/v1/schemas/actionTypes/1',
				organizationId: this.getData('organizationId1'),
				schema: {
		      $schema: "http://json-schema.org/draft-04/schema#",
	        type: "object",
		      properties: {
			      message: {
			        type: "string"
			      }
			    }
			  }
			}
		};
	})
	.storeLocationAs('actionType', 1)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates action type AT2 in Orga2')
	.post({ url: '/v1/actionTypes'}, function() {
		return {
			body: {
				name: 'AT2',
				description: 'Action to reduce the thermostat.',
				public: true,
				type: 'http://localhost.localdomain/v1/schemas/actionTypes/2',
				organizationId: this.getData('organizationId2'),
				schema: {
		      $schema: "http://json-schema.org/draft-04/schema#",
	        type: "object",
		      properties: {
			      message: {
			        type: "string"
			      }
			    }
			  }
			}
		};
	})
	.storeLocationAs('actionType', 2)
	.expectStatusCode(201);

testSuite
	.describe('U1 create event type ET1 in Orga1')
	.post({ url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET1',
				description: 'Represent an increase in the temperature.',
				public: true,
				type: 'http://localhost.localdomain/v1/schemas/eventTypes/1',
				organizationId: this.getData('organizationId1'),
				schema: {
			    $schema: "http://json-schema.org/draft-04/schema#",
			    type: "object",
			    properties: {
			      sensorId: {
			        type: "string"
			      }
			    }
			  }
			}
		};
	})
	.storeLocationAs('eventType', 1)
	.expectStatusCode(201);

testSuite
	.describe('U1 create event type ET2 in Orga2')
	.post({ url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET2',
				description: 'Represent an increase in the temperature.',
				public: true,
				type: 'http://localhost.localdomain/v1/schemas/eventTypes/2',
				organizationId: this.getData('organizationId2'),
				schema: {
			    $schema: "http://json-schema.org/draft-04/schema#",
			    type: "object",
			    properties: {
			      sensorId: {
			        type: "string"
			      }
			    }
			  }
			}
		};
	})
	.storeLocationAs('eventType', 2)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates Rule1 in Orga1')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Rule1',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1'),
					eventTypeId: this.getData('eventTypeId1')
				}]
			}
		};
	})
	.storeLocationAs('rule', 1)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates Rule2 in Orga2')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Rule1',
				active: true,
				organizationId: this.getData('organizationId2'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId2'),
					eventTypeId: this.getData('eventTypeId2')
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId2'),
					actionTypeId: this.getData('actionTypeId2'),
					eventTypeId: this.getData('eventTypeId2')
				}]
			}
		};
	})
	.storeLocationAs('rule', 1)
	.expectStatusCode(201);

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // START - Retrieves
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

testSuite
  .describe('U1 retrieves all accessible action target templates.')
 	.get({ url: '/v1/actionTargetTemplates' })
 	.expectStatusCode(200)
  .expectJsonCollectionToHaveSize(2)
  .expectJsonToBeAtLeast(function() {
    return [{
      id: this.getData('actionTargetTemplateId1'),
      name: 'ATT1',
      organizationId: this.getData('organizationId1')
    }, {
      id: this.getData('actionTargetTemplateId2'),
      name: 'ATT2',
      organizationId: this.getData('organizationId2')
    }];
  });

testSuite
  .describe('U1 retrieves all accessible event source templates.')
 	.get({ url: '/v1/eventSourceTemplates' })
 	.expectStatusCode(200)
  .expectJsonCollectionToHaveSize(2)
  .expectJsonToBeAtLeast(function() {
    return [{
      id: this.getData('eventSourceTemplateId1'),
      name: 'EST1',
      organizationId: this.getData('organizationId1')
    }, {
      id: this.getData('eventSourceTemplateId2'),
      name: 'EST2',
      organizationId: this.getData('organizationId2')
    }];
  });

testSuite
  .describe('U1 retrieves all accessible action targets.')
 	.get({ url: '/v1/actionTargets' })
 	.expectStatusCode(200)
  .expectJsonCollectionToHaveSize(2)
  .expectJsonToBeAtLeast(function() {
    return [{
      id: this.getData('actionTargetId1'),
      name: 'AT1',
      organizationId: this.getData('organizationId1'),
      actionTargetTemplateId: this.getData('actionTargetTemplateId1')
    }, {
      id: this.getData('actionTargetId2'),
      name: 'AT2',
      organizationId: this.getData('organizationId2'),
      actionTargetTemplateId: this.getData('actionTargetTemplateId2')
    }];
  });

testSuite
  .describe('U1 retrieves all accessible event sources.')
 	.get({ url: '/v1/eventSources' })
 	.expectStatusCode(200)
  .expectJsonCollectionToHaveSize(2)
  .expectJsonToBeAtLeast(function() {
    return [{
      id: this.getData('eventSourceId1'),
      name: 'ES1',
      organizationId: this.getData('organizationId1'),
      eventSourceTemplateId: this.getData('eventSourceTemplateId1')
    }, {
      id: this.getData('eventSourceId2'),
      name: 'ES2',
      organizationId: this.getData('organizationId2'),
      eventSourceTemplateId: this.getData('eventSourceTemplateId2')
    }];
  });

testSuite
  .describe('U1 retrieves all accessible action types.')
 	.get({ url: '/v1/actionTypes' })
 	.expectStatusCode(200)
  .expectJsonCollectionToHaveSize(2)
  .expectJsonToBeAtLeast(function() {
    return [{
      id: this.getData('actionTypeId1'),
      name: 'AT1',
      organizationId: this.getData('organizationId1')
    }, {
      id: this.getData('actionTypeId2'),
      name: 'AT2',
      organizationId: this.getData('organizationId2')
    }];
  });

testSuite
  .describe('U1 retrieves all accessible event types.')
 	.get({ url: '/v1/eventTypes' })
 	.expectStatusCode(200)
  .expectJsonCollectionToHaveSize(2)
  .expectJsonToBeAtLeast(function() {
    return [{
      id: this.getData('eventTypeId1'),
      name: 'ET1',
      organizationId: this.getData('organizationId1')
    }, {
      id: this.getData('eventTypeId2'),
      name: 'ET2',
      organizationId: this.getData('organizationId2')
    }];
  });

module.exports = testSuite;