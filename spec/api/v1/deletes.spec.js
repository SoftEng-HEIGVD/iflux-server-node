var
	helpers = require('./helpers/rules-helpers'),
	baseTest = require('../base');

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
	.describe('U1 creates action target AT1 in Orga1')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT1',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1')
			}
		};
	})
	.storeLocationAs('actionTarget', 1)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates event source ES1 in Orga1')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES1',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1')
			}
		};
	})
	.storeLocationAs('eventSource', 1)
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

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // START - Deletes when rule is not deleted
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

testSuite
  .describe('U1 tries to delete Orga1 - all models are present')
 	.delete({}, function() { return { url: this.getData('locationOrganization1') }; })
 	.expectStatusCode(403)
 	.expectJsonToBe({ message: 'The organization cannot be deleted. The model is referenced by other models.' });

testSuite
  .describe('U1 tries to delete ATT1')
 	.delete({}, function() { return { url: this.getData('locationActionTargetTemplate1') }; })
 	.expectStatusCode(403)
  .expectJsonToBe({ message: 'The action target template cannot be deleted. The model is referenced by other models.' });

testSuite
  .describe('U1 tries to delete EST1')
 	.delete({}, function() { return { url: this.getData('locationEventSourceTemplate1') }; })
 	.expectStatusCode(403)
  .expectJsonToBe({ message: 'The event source template cannot be deleted. The model is referenced by other models.' });

testSuite
  .describe('U1 tries to delete ATA1')
 	.delete({}, function() { return { url: this.getData('locationActionTarget1') }; })
 	.expectStatusCode(403)
  .expectJsonToBe({ message: 'The action target cannot be deleted. The model is referenced by other models.' });

testSuite
  .describe('U1 tries to delete ESO1')
 	.delete({}, function() { return { url: this.getData('locationEventSource1') }; })
 	.expectStatusCode(403)
  .expectJsonToBe({ message: 'The event source cannot be deleted. The model is referenced by other models.' });

testSuite
  .describe('U1 tries to delete AT1')
 	.delete({}, function() { return { url: this.getData('locationActionType1') }; })
 	.expectStatusCode(403)
  .expectJsonToBe({ message: 'The action type cannot be deleted. The model is referenced by other models.' });

testSuite
  .describe('U1 tries to delete ET1')
 	.delete({}, function() { return { url: this.getData('locationEventType1') }; })
 	.expectStatusCode(403)
  .expectJsonToBe({ message: 'The event type cannot be deleted. The model is referenced by other models.' });

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // START - Delete rule, action type, event type, action target and event source
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

testSuite
  .describe('U1 deletes Rule1')
 	.delete({}, function() { return { url: this.getData('locationRule1') }; })
 	.expectStatusCode(204);

testSuite
  .describe('U1 deletes ATA1')
 	.delete({}, function() { return { url: this.getData('locationActionTarget1') }; })
 	.expectStatusCode(204);

testSuite
  .describe('U1 deletes ESO1')
 	.delete({}, function() { return { url: this.getData('locationEventSource1') }; })
 	.expectStatusCode(204);

testSuite
  .describe('U1 deletes AT1')
 	.delete({}, function() { return { url: this.getData('locationActionType1') }; })
 	.expectStatusCode(204);

testSuite
  .describe('U1 deletes ET1')
 	.delete({}, function() { return { url: this.getData('locationEventType1') }; })
 	.expectStatusCode(204);

testSuite
  .describe('U1 tries to delete Orga1 - after action/event types, event source and action target removed')
 	.delete({}, function() { return { url: this.getData('locationOrganization1') }; })
 	.expectStatusCode(403)
 	.expectJsonToBe({ message: 'The organization cannot be deleted. The model is referenced by other models.' });

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // START - Delete action target template and event source template
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

testSuite
  .describe('U1 deletes ATT1')
 	.delete({}, function() { return { url: this.getData('locationActionTargetTemplate1') }; })
 	.expectStatusCode(204);

testSuite
  .describe('U1 deletes EST1')
 	.delete({}, function() { return { url: this.getData('locationEventSourceTemplate1') }; })
 	.expectStatusCode(204);

testSuite
  .describe('U1 tries to delete Orga1 - after templates removed')
 	.delete({}, function() { return { url: this.getData('locationOrganization1') }; })
 	.expectStatusCode(403)
 	.expectJsonToBe({ message: 'The organization cannot be deleted. The model is referenced by other models.' });

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // START - Remove user U2 from organization and delete the organization
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

testSuite
  .describe('U1 remove U2 in Orga1')
 	.post({}, function() {
 		return {
 			url: this.getData('locationOrganization1') + '/actions',
 			body: {
 				type: "removeUser",
 				email: "henri.dutoit@localhost.localdomain"
 			}
 		};
 	})
 	.expectStatusCode(200);

testSuite
 	.describe('U1 deletes Orga1')
 	.delete({}, function() { return { url: this.getData('locationOrganization1') }; })
 	.expectStatusCode(204);

module.exports = testSuite;