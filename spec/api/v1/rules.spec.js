var
	helpers = require('./helpers/rules-helpers'),
	baseTest = require('../base');

module.exports = helpers.setup(baseTest('Rule resource'))
	.describe('First user create first rule with [first orga, first event source, first event type, first action target, first action type].')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {
						expression: 'return event.properties.temperature.old != event.properties.temperature.new',
						sampleEvent: {
							temperature: {
								old: 10,
								new: 11
							}
						}
					}
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {
						expression: 'return "The new temperature is: " + event.properties.temperature;',
						sample: {
							event: {
								temperature: 12
							}
						}
					}
				}]
			}
		};
	})
	.storeLocationAs('rule', 1)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/rules/:id')

	.describe('First user create first rule with [second orga, first event source, first action target, first action type].')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Second rule',
				active: true,
				organizationId: this.getData('organizationId2'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId2')
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1'),
					fn: {
						expression: 'return "Received event: " + event.name;',
						sample: {
							event: {
							}
						}
					}
				}]
			}
		};
	})
	.storeLocationAs('rule', 2)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/rules/:id')

	.describe('Second user create first rule with [third orga, fourth event source, fourth action target, fourth action type].')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Third rule',
				active: true,
				organizationId: this.getData('organizationId3'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId4')
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId4'),
					actionTypeId: this.getData('actionTypeId4'),
					fn: {
						expression: 'return "Received event: " + event.name;',
						sample: {
							event: {
							}
						}
					}
				}]
			}
		};
	})
	.storeLocationAs('rule', 3)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/rules/:id')

	.describe('First user tries to retrieve rules.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: '/v1/rules?organizationId=' + this.getData('organizationId1') + 100 }; })
	.expectStatusCode(403)

	.describe('First user tries to retrieve rules in an organization where he is not a member.')
	.get({}, function() { return { url: '/v1/rules?organizationId=' + this.getData('organizationId3') }; })
	.expectStatusCode(403)

	.describe('First user retrieve rules in his first organization.')
	.get({}, function() { return { url: '/v1/rules?organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToHavePath([ '0.conditions.0.eventSource', '0.conditions.0.eventSource.id', '0.conditions.0.eventSource.generatedIdentifier', '0.conditions.0.eventType', '0.transformations.0.actionTarget', '0.transformations.0.actionType', '0.transformations.0.eventType' ])
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('ruleId1'),
			name: 'First rule',
			description: null,
			active: true,
			organizationId: this.getData('organizationId1'),
			conditions: [{
				eventSource: {
					id: this.getData('eventSourceId1'),
				},
				eventType: {
					id: this.getData('eventTypeId1')
				},
				fn: {
					expression: 'return event.properties.temperature.old != event.properties.temperature.new',
					sampleEvent: {
						temperature: {
							old: 10,
							new: 11
						}
					}
				}
			}],
			transformations: [{
				actionTarget: {
					id: this.getData('actionTargetId1'),
				},
				actionType: {
					id: this.getData('actionTypeId1')
				},
				eventType: {
					id: this.getData('eventTypeId1'),
				},
				fn: {
					expression: 'return "The new temperature is: " + event.properties.temperature;',
					sample: {
						event: {
							temperature: 12
						}
					}
				}
			}]
		}];
	})

	.describe('First user retrieve rules in his first organization filtered by name.')
	.get({}, function() { return { url: '/v1/rules?organizationId=' + this.getData('organizationId1') + '&name=First%' }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('ruleId1'),
			name: 'First rule',
			description: null,
			active: true,
			organizationId: this.getData('organizationId1'),
			conditions: [{
				eventSource: {
					id: this.getData('eventSourceId1')
				},
				eventType: {
					id: this.getData('eventTypeId1')
				},
				fn: {
					expression: 'return event.properties.temperature.old != event.properties.temperature.new',
					sampleEvent: {
						temperature: {
							old: 10,
							new: 11
						}
					}
				}
			}],
			transformations: [{
				actionTarget: {
					id: this.getData('actionTargetId1')
				},
				actionType: {
					id: this.getData('actionTypeId1')
				},
				eventType: {
					id: this.getData('eventTypeId1')
				},
				fn: {
					expression: 'return "The new temperature is: " + event.properties.temperature;',
					sample: {
						event: {
							temperature: 12
						}
					}
				}
			}]
		}];
	})

	.describe('First user retrieve rules in his second organization.')
	.get({}, function() { return { url: '/v1/rules?organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToHavePath([ '0.conditions.0.eventSource.generatedIdentifier', '0.transformations.0.actionTarget.generatedIdentifier', '0.transformations.0.actionType' ])
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('ruleId2'),
			name: 'Second rule',
			active: true,
			organizationId: this.getData('organizationId2'),
			conditions: [{
				eventSource:{
					id: this.getData('eventSourceId2')
				}
			}],
			transformations: [{
				actionTarget:{
					id: this.getData('actionTargetId1')
				},
				actionType:{
					id: this.getData('actionTypeId1')
				},
				fn: {
					expression: 'return "Received event: " + event.name;',
					sample: {
						event: {
						}
					}
				}
			}]
		}];
	})

	.describe('First user retrieve rules in all his organizations.')
	.get({ url: '/v1/rules' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('ruleId1'),
			name: 'First rule',
			description: null,
			active: true,
			organizationId: this.getData('organizationId1'),
			conditions: [{
				eventSource: {
					id: this.getData('eventSourceId1')
				},
				eventType:{
					id: this.getData('eventTypeId1')
				},
				fn: {
					expression: 'return event.properties.temperature.old != event.properties.temperature.new',
					sampleEvent: {
						temperature: {
							old: 10,
							new: 11
						}
					}
				}
			}],
			transformations: [{
				actionTarget:{
					id: this.getData('actionTargetId1')
				},
				actionType:{
					id: this.getData('actionTypeId1')
				},
				eventType:{
					id: this.getData('eventTypeId1')
				},
				fn: {
					expression: 'return "The new temperature is: " + event.properties.temperature;',
					sample: {
						event: {
							temperature: 12
						}
					}
				}
			}]
		}, {
			id: this.getData('ruleId2'),
			name: 'Second rule',
			active: true,
			organizationId: this.getData('organizationId2'),
			conditions: [{
				eventSource:{
					id: this.getData('eventSourceId2')
				}
			}],
			transformations: [{
				actionTarget:{
					id: this.getData('actionTargetId1')
				},
				actionType:{
					id: this.getData('actionTypeId1')
				},
				fn: {
					expression: 'return "Received event: " + event.name;',
					sample: {
						event: {
						}
					}
				}
			}]
		}];
	})

	.describe('First user retrieve rules in all his organizations filtered by name.')
	.get({ url: '/v1/rules?name=Second%' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('ruleId2'),
			name: 'Second rule',
			active: true,
			organizationId: this.getData('organizationId2'),
			conditions: [{
				eventSource:{
					id: this.getData('eventSourceId2')
				}
			}],
			transformations: [{
				actionTarget:{
					id: this.getData('actionTargetId1')
				},
				actionType:{
					id: this.getData('actionTypeId1')
				},
				fn: {
					expression: 'return "Received event: " + event.name;',
					sample: {
						event: {
						}
					}
				}
			}]
		}];
	})

	.describe('Second user tries to retrieve rules in an organization where he is not a member.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({}, function() { return { url: '/v1/rules?organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(403)

	.describe('Second user retrieve rules in his organization.')
	.get({}, function() { return { url: '/v1/rules?organizationId=' + this.getData('organizationId3') }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToHavePath([ '0.conditions.0.eventSource.generatedIdentifier', '0.transformations.0.actionTarget.generatedIdentifier', '0.transformations.0.actionType' ])
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('ruleId3'),
			name: 'Third rule',
			active: true,
			organizationId: this.getData('organizationId3'),
			conditions: [{
				eventSource:{
					id: this.getData('eventSourceId4')
				}
			}],
			transformations: [{
				actionTarget:{
					id: this.getData('actionTargetId4')
				},
				actionType:{
					id: this.getData('actionTypeId4')
				},
				fn: {
					expression: 'return "Received event: " + event.name;',
					sample: {
						event: {
						}
					}
				}
			}]
		}];
	})

	.describe('Second user retrieve rules in all his organizations.')
	.get({ url: '/v1/rules' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('ruleId3'),
			name: 'Third rule',
			active: true,
			organizationId: this.getData('organizationId3'),
			conditions: [{
				eventSource:{
					id: this.getData('eventSourceId4')
				}
			}],
			transformations: [{
				actionTarget:{
					id: this.getData('actionTargetId4')
				},
				actionType:{
					id: this.getData('actionTypeId4')
				},
				fn: {
					expression: 'return "Received event: " + event.name;',
					sample: {
						event: {
						}
					}
				}
			}]
		}];
	})

	.describe('First user tries to retrieve a rule that does not exist.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: this.getData('locationRule1') + '100' }; })
	.expectStatusCode(403)

	.describe('First user tries to retrieve a rule from an organization where he is not a member.')
	.get({}, function() { return { url: this.getData('locationRule3') }; })
	.expectStatusCode(403)

	.describe('First user retrieve his first rule.')
	.get({}, function() { return { url: this.getData('locationRule1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ 'conditions.0.eventSource.generatedIdentifier', 'conditions.0.eventType', 'transformations.0.actionTarget.generatedIdentifier', 'transformations.0.actionType', 'transformations.0.eventType' ])
	.expectJsonToBeAtLeast(function() {
		return {
			id: this.getData('ruleId1'),
			name: 'First rule',
			description: null,
			active: true,
			organizationId: this.getData('organizationId1'),
			conditions: [{
				eventSource:{
					id: this.getData('eventSourceId1')
				},
				eventType:{
					id: this.getData('eventTypeId1')
				},
				fn: {
					expression: 'return event.properties.temperature.old != event.properties.temperature.new',
					sampleEvent: {
						temperature: {
							old: 10,
							new: 11
						}
					}
				}
			}],
			transformations: [{
				actionTarget:{
					id: this.getData('actionTargetId1')
				},
				actionType:{
					id: this.getData('actionTypeId1')
				},
				eventType:{
					id: this.getData('eventTypeId1')
				},
				fn: {
					expression: 'return "The new temperature is: " + event.properties.temperature;',
					sample: {
						event: {
							temperature: 12
						}
					}
				}
			}]
		};
	})

	.describe('First user updates hist first rule.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				name: 'First rule renamed'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/rules/:id')

	.describe('First user updates hist first rule.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/rules/:id')

	.describe('Second user tries to update the first rule of first user.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				name: 'First rule renamed by second user'
			}
		};
	})
	.expectStatusCode(403)

	.describe('First user remove his first rule.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.delete({}, function() { return { url: this.getData('locationRule1') }; })
	.expectStatusCode(204)

	.describe('First user tries to retrieve a rule his deleted rule.')
	.get({}, function() { return { url: this.getData('locationRule1') }; })
	.expectStatusCode(403)

	.describe('First user tries to delete a rule in an organization where he is not a member.')
	.get({}, function() { return { url: this.getData('locationRule3') }; })
	.expectStatusCode(403)
;