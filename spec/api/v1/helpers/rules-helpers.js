module.exports = {
	setup: function(baseTest) {
		return baseTest
			.createUser('Register first user')
			.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })

			.signinUser('Signing first user')
			.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' })

			.createOrganization('Create new organization for first user', { name: 'Orga 1' }, 1, 1)
			.createOrganization('Create second organization for first user', { name: 'Orga 2' }, 1, 2)

			.createOrganization('Create new organization for second user', { name: 'Orga 3' }, 2, 3)

			.createEventSourceTemplate('Create first event source template for first user', { name: 'Event source template 1', public: true }, 1, 1)
			.createEventSourceTemplate('Create second event source template for first user', { name: 'Event source template 2', public: false }, 1, 2)

			.createEventSourceTemplate('Create first event source template for second user', { name: 'Event source template 3', public: false }, 2, 3)

			.createEventType('Create first event type for first template', { name: 'Temperature increase', type: 'http://iflux.io/schemas/eventTypes/1' }, 1, 1)
			.createEventType('Create second event type for first template', { name: 'Temperature decrease', type: 'http://iflux.io/schemas/eventTypes/2' }, 1, 1)
			.createEventType('Create first event type for second template', { name: 'Temperature change', type: 'http://iflux.io/schemas/eventTypes/3' }, 1, 2)

			.createEventType('Create first event type for third template', { name: 'Lightening' }, 2, 3)

			.createEventSource('Create first event source for first user, first template in first orga', { name: 'First source' }, 1, 1, 1)
			.createEventSource('Create second event source for first user, first template in second orga', { name: 'Second source' }, 1, 2, 1)
			.createEventSource('Create third event source for first user, second template in second orga', { name: 'Third source' }, 1, 2, 2)

			.createEventSource('Create first event source for second user, first template in third orga', { name: 'Fourth source' }, 2, 3, 1)
			.createEventSource('Create second event source for second user, third template in third orga', { name: 'Fifth source' }, 2, 3, 3)

			.createActionTargetTemplate('Create first action target template for first user', { name: 'Action target template 1', public: true }, 1, 1)
			.createActionTargetTemplate('Create second action target template for first user', { name: 'Action target template 2', public: false }, 1, 2)

			.createActionTargetTemplate('Create first action target template for second user', { name: 'Action target template 3', public: false }, 2, 3)

			.createActionType('Create first action type for first template', { name: 'Radiator increase', type: 'http://iflux.io/schemas/actionTypes/1' }, 1, 1)
			.createActionType('Create second action type for first template', { name: 'Radiator decrease', type: 'http://iflux.io/schemas/actionTypes/2' }, 1, 1)
			.createActionType('Create first action type for second template', { name: 'Radiator change', type: 'http://iflux.io/schemas/actionTypes/3' }, 1, 2)

			.createActionType('Create first action type for third template', { name: 'Messaging' }, 2, 3)

			.createActionTarget('Create first action target for first user, first template in first orga', { name: 'First target' }, 1, 1, 1)
			.createActionTarget('Create second action target for first user, first template in second orga', { name: 'Second target' }, 1, 2, 1)
			.createActionTarget('Create third action target for first user, second template in second orga', { name: 'Third target' }, 1, 2, 2)

			.createActionTarget('Create first action target for second user, first template in third orga', { name: 'Fourth target' }, 2, 3, 1)
			.createActionTarget('Create second action target for second user, third template in third orga', { name: 'Fifth target' }, 2, 3, 3)
		;
	}
};