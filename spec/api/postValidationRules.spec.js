var
	helpers = require('./helpers/rules-helpers'),
	baseTest = require('../base');

module.exports = helpers.setup(baseTest('Validations on rule resource'))
	.describe('First user tries to create a rule with wrong organization.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1') + 100
			}
		}
	})
	.expectStatusCode(422)
	.expectJsonToBe({ organizationId: [ 'Organization not found.' ] })

	.describe('First user tries to create a rule with in an organization where he is not a member.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId3')
			}
		}
	})
	.expectStatusCode(422)
	.expectJsonToBe({ organizationId: [ 'Organization not found.' ] })

	.describe('First user tries to create a rule without conditions.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1')
			}
		}
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
		}
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
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		}
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: [ 'At least one of eventSourceInstanceId, eventTypeId or fn must be provided.' ] }})

	.describe('First user tries to create a rule with a condition where the event source instance does not exists.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceInstanceId: this.getData('eventSourceInstanceId1') + 100
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		}
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { eventSourceInstanceId: [ 'Event source instance not found.' ] }}})

	.describe('First user tries to create a rule with a condition where the event source instance where user does not have access.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceInstanceId: this.getData('eventSourceInstanceId4')
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		}
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { eventSourceInstanceId: [ 'Event source instance not found.' ] }}})

	.describe('First user tries to create a rule with a condition where the event type does not exist.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
					eventTypeId: this.getData('eventTypeId1') + 100
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		}
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
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
					eventTypeId: this.getData('eventTypeId4')
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		}
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
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {}
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		}
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
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
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
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		}
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
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {
						expression: 'return event.temperature.old != event.temperature.new'
					}
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		}
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
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
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
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		}
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
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {
						expression: 'return event.temperature.old != event.temperature.new',
						sampleEvent: {
							temperature: {
								old: 10,
								new: 10
							}
						}
					}
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		}
	})
	.expectStatusCode(422)
	.expectJsonToBe({ conditions: { 0: { fn: { expression: [ 'Sample evaluation against expression returned false.' ] }}}})

	.describe('First user tries to create a rule with a transformation where the action target instance does not exists.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceInstanceId: this.getData('eventSourceInstanceId1')
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1') + 100,
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		}
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { actionTargetInstanceId: [ 'Action target instance not found.' ] }}})

	.describe('First user tries to create a rule with a transformation where the action target instance where user does not have access.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceInstanceId: this.getData('eventSourceInstanceId1')
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId4'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		}
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { actionTargetInstanceId: [ 'Action target instance not found.' ] }}})

	.describe('First user tries to create a rule with a transformation where the action type does not exist.')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'First rule',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1') + 100
				}]
			}
		}
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
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId4')
				}]
			}
		}
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
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1'),
					eventTypeId: this.getData('eventTypeId1') + 100
				}]
			}
		}
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
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1'),
					eventTypeId: this.getData('eventTypeId4')
				}]
			}
		}
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
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {}
				}]
			}
		}
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
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
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
		}
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
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {
						expression: 'return "The new temperature is: " + event.temperature;'
					}
				}]
			}
		}
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
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
					actionTypeId: this.getData('actionTypeId1'),
					eventTypeId: this.getData('eventTypeId1'),
					fn: {
						expression: 'return "The new temperature is: " + event.temperature;',
						sample: {}
					}
				}]
			}
		}
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
					eventSourceInstanceId: this.getData('eventSourceInstanceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
				transformations: [{
					actionTargetInstanceId: this.getData('actionTargetInstanceId1'),
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
		}
	})
	.expectStatusCode(422)
	.expectJsonToBe({ transformations: { 0: { fn: { expression: [ 'An error occurred during expression evaluation: Line 1: Unexpected string' ] }}}})
;