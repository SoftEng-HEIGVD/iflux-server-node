var
	helpers = require('./helpers/rules-helpers'),
	baseTest = require('../base');

module.exports = helpers.setup(baseTest('Validations on rule resource'))
	.describe('First user tries to create a rule with missing organization.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBeAtLeast({ organizationId: [ 'Organization id is mandatory.' ] })

	.describe('First user tries to create a rule with wrong organization.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1') + 100
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBeAtLeast({ organizationId: [ 'Organization not found.' ] })

	.describe('First user tries to create a rule with in an organization where he is not a member.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId3')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBeAtLeast({ organizationId: [ 'Organization not found.' ] })

	.describe('First user tries to create a rule without conditions.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: [ 'At least one condition must be defined.' ], transformations: [ 'At least one transformation must be defined.' ] })

	.describe('First user tries to create a rule with empty conditions.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [],
				transformations: []
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: [ 'At least one condition must be defined.' ], transformations: [ 'At least one transformation must be defined.' ] })

	.describe('First user tries to create a rule with a empty condition.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{ }],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: [ 'At least one of eventSourceId, eventTypeId or fn must be provided.' ] }})

	.describe('First user tries to create a rule with a condition where the event source does not exists.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1') + 100
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { eventSourceId: [ 'Event source not found.' ] }}})

	.describe('First user tries to create a rule with a condition where the event source where user does not have access.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId4')
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { eventSourceId: [ 'Event source not found.' ] }}})

	.describe('First user tries to create a rule with a condition where the event type does not exist.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1') + 100
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { eventTypeId: [ 'Event type not found.' ] }}})

	.describe('First user tries to create a rule with a condition with event type where user does not have access.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId5')
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { eventTypeId: [ 'Event type not found.' ] }}})

	.describe('First user tries to create a rule with a condition with wrong function.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {}
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { fn: { expression: [ 'Expression is mandatory.' ], sampleEvent: [ 'Sample event is mandatory.' ] }}}})

	.describe('First user tries to create a rule with a condition with missing expression.')
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
						sampleEvent: {
							temperature: {
								old: 10,
								new: 12
							}
						}
					}
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { fn: { expression: [ 'Expression is mandatory.' ] }}}})

	.describe('First user tries to create a rule with a condition where the event type with missing sample.')
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
						expression: 'return event.temperature.old != event.temperature.new'
					}
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { fn: { sampleEvent: [ 'Sample event is mandatory.' ] }}}})

	.describe('First user tries to create a rule with a condition with syntax error.')
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
						expression: 'retur event.temperature.old != event.temperature.new',
						sampleEvent: {
							temperature: {
								old: 10,
								new: 10
							}
						}
					}
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { fn: { expression: [ 'An error occurred during expression evaluation: Line 1: Unexpected identifier' ] }}}})

	.describe('First user tries to create a rule with a condition evaluated to false.')
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
								new: 10
							}
						}
					}
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { fn: { expression: [ 'Sample evaluation against expression returned false.' ] }}}})

	.describe('First user tries to create a rule with a transformation with missing action target id.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1')
				}],
				transformations: [{
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { actionTargetId: [ 'Action target id is mandatory.' ] }}})

	.describe('First user tries to create a rule with a transformation with missing action type id.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1')
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { actionTypeId: [ 'Action type id is mandatory.' ] }}})

	.describe('First user tries to create a rule with a transformation where the action target does not exists.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1')
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1') + 100,
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { actionTargetId: [ 'Action target not found.' ] }}})

	.describe('First user tries to create a rule with a transformation where the action target where user does not have access.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1')
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId4'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { actionTargetId: [ 'Action target not found.' ] }}})

	.describe('First user tries to create a rule with a transformation where the action type does not exist.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1') + 100
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { actionTypeId: [ 'Action type not found.' ] }}})

	.describe('First user tries to create a rule with a transformation with action type where user does not have access.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId5')
				}]
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { actionTypeId: [ 'Action type not found.' ] }}})

	.describe('First user tries to create a rule with a transformation where the event type does not exist.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
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

	.describe('First user tries to create a rule with a transformation with event type where user does not have access.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
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

	.describe('First user tries to create a rule with a transformation with wrong function.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
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

	.describe('First user tries to create a rule with a transformation with missing expression.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
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

	.describe('First user tries to create a rule with a transformation with missing sample.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
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

	.describe('First user tries to create a rule with a transformation with missing sample event.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
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

	.describe('First user tries to create a rule with a transformation with syntax error.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
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