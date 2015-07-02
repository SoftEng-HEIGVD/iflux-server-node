var
	helpers = require('./helpers/rules-helpers'),
	baseTest = require('../base');

module.exports = helpers.setup(baseTest('Validations on rule resource'))
	.describe('First user create RU1 rule with [first orga, first event source, first event type, first action target, first action type].')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({ url: '/v1/rules' }, function() {
		return {
			body: {
				name: 'RU1',
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

	.describe('First user create RU2 rule with [first orga, first event source, first event type, first action target, first action type].')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({ url: '/v1/rules' }, function() {
		return {
			body: {
				name: 'RU2',
				active: false,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.storeLocationAs('rule', 2)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/rules/:id')

	.describe('First user tries to re-create RU2 rule with same name.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({ url: '/v1/rules' }, function() {
		return {
			body: {
				name: 'RU2',
				active: false,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ name: [ 'Name is already taken in this organization.' ]})

	.describe('First user re-create RU2 rule with same name in different organization.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({ url: '/v1/rules' }, function() {
		return {
			body: {
				name: 'RU2',
				active: false,
				organizationId: this.getData('organizationId2'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId3'),
					eventTypeId: this.getData('eventTypeId4')
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId3'),
					actionTypeId: this.getData('actionTypeId4')
				}]
			}
		};
	})
	.storeLocationAs('rule', 3)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/rules/:id')

	.describe('First user can rename RU1 with a name not already used in the organization.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.patch({ }, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				name: 'RU1 renamed'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/rules/:id')

	.describe('First user cannot rename RU1 with a name already used in the organization.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.patch({ }, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				name: 'RU2'
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ name: [ 'Name is already taken in this organization.' ]})

	.describe('First user tries to update a rule with empty conditions.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				conditions: []
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: [ 'At least one condition must be defined.' ] })

	.describe('First user tries to update a rule with empty transformations.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				transformations: []
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: [ 'At least one transformation must be defined.' ] })

	.describe('First user tries to update a rule with a empty condition.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				conditions: [{ }]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: [ 'At least one of eventSourceId, eventTypeId or fn must be provided.' ] }})

	.describe('First user tries to update a rule with a condition where the event source does not exists.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				conditions: [{
					eventSourceId: this.getData('eventSourceId1') + 100
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { eventSourceId: [ 'Event source not found.' ] }}})

	.describe('First user tries to update a rule with a condition where the event source where user does not have access.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				conditions: [{
					eventSourceId: this.getData('eventSourceId4')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { eventSourceId: [ 'Event source not found.' ] }}})

	.describe('First user tries to update a rule with a condition where the event type does not exist.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1') + 100
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { eventTypeId: [ 'Event type not found.' ] }}})

	.describe('First user tries to update a rule with a condition with event type where user does not have access.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId5')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { eventTypeId: [ 'Event type not found.' ] }}})

	.describe('First user tries to update a rule with a condition with wrong function.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {}
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { fn: { expression: [ 'Expression is mandatory.' ], sampleEvent: [ 'Sample event is mandatory.' ] }}}})

	.describe('First user tries to update a rule with a condition with missing expression.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {
						sampleEvent: {
							temperature: {
								old: 10,
								new: 12
							}
						}
					}
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { fn: { expression: [ 'Expression is mandatory.' ] }}}})

	.describe('First user tries to update a rule with a condition where the event type with missing sample.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {
						expression: 'return event.temperature.old != event.temperature.new'
					}
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { fn: { sampleEvent: [ 'Sample event is mandatory.' ] }}}})

	.describe('First user tries to update a rule with a condition with syntax error.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {
						expression: 'retur event.temperature.old != event.temperature.new',
						sampleEvent: {
							temperature: {
								old: 10,
								new: 10
							}
						}
					}
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { fn: { expression: [ 'An error occurred during expression evaluation: Line 1: Unexpected identifier' ] }}}})

	.describe('First user tries to update a rule with a condition evaluated to false.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {
						expression: 'return event.properties.temperature.old != event.properties.temperature.new',
						sampleEvent: {
							temperature: {
								old: 10,
								new: 10
							}
						}
					}
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { fn: { expression: [ 'Sample evaluation against expression returned false.' ] }}}})

	.describe('First user tries to update a rule with a transformation with missing action target id.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				transformations: [{
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { actionTargetId: [ 'Action target id is mandatory.' ] }}})

	.describe('First user tries to update a rule with a transformation with missing action type id.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				transformations: [{
					actionTargetId: this.getData('actionTargetId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { actionTypeId: [ 'Action type id is mandatory.' ] }}})

	.describe('First user tries to update a rule with a transformation where the action target does not exists.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				transformations: [{
					actionTargetId: this.getData('actionTargetId1') + 100,
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { actionTargetId: [ 'Action target not found.' ] }}})

	.describe('First user tries to update a rule with a transformation where the action target where user does not have access.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				transformations: [{
					actionTargetId: this.getData('actionTargetId4'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { actionTargetId: [ 'Action target not found.' ] }}})

	.describe('First user tries to update a rule with a transformation where the action type does not exist.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1') + 100
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { actionTypeId: [ 'Action type not found.' ] }}})

	.describe('First user tries to update a rule with a transformation with action type where user does not have access.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId5')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { actionTypeId: [ 'Action type not found.' ] }}})

	.describe('First user tries to update a rule with a transformation where the event type does not exist.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1'),
					eventTypeId: this.getData('eventTypeId1') + 100
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { eventTypeId: [ 'Event type not found.' ] }}})

	.describe('First user tries to update a rule with a transformation with event type where user does not have access.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1'),
					eventTypeId: this.getData('eventTypeId5')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { eventTypeId: [ 'Event type not found.' ] }}})

	.describe('First user tries to update a rule with a transformation with wrong function.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {}
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { fn: { expression: [ 'Expression is mandatory.' ], sample: [ 'Sample is mandatory.' ] }}}})

	.describe('First user tries to update a rule with a transformation with missing expression.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {
						sample: {
							event: {
								temperature: {
									old: 10,
									new: 12
								}
							}
						}
					}
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { fn: { expression: [ 'Expression is mandatory.' ] }}}})

	.describe('First user tries to update a rule with a transformation with missing sample.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {
						expression: 'return "The new temperature is: " + event.temperature;'
					}
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { fn: { sample: [ 'Sample is mandatory.' ] }}}})

	.describe('First user tries to update a rule with a transformation with missing sample event.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {
						expression: 'return "The new temperature is: " + event.temperature;',
						sample: {}
					}
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { fn: { sample: { event: [ 'Event is mandatory.' ] }}}}})

	.describe('First user tries to update a rule with a transformation with syntax error.')
	.patch({}, function() {
		return {
			url: this.getData('locationRule1'),
			body: {
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {
						expression: 'retur "The new temperature is: " + event.temperature;',
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
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { fn: { expression: [ 'An error occurred during expression evaluation: Line 1: Unexpected string' ] }}}})
;