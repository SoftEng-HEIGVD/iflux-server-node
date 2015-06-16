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

			.createEventSourceInstance('Create first event source instance for first user, first template in first orga', { name: 'First instance' }, 1, 1, 1)
			.createEventSourceInstance('Create second event source instance for first user, first template in second orga', { name: 'Second instance' }, 1, 2, 1)
			.createEventSourceInstance('Create third event source instance for first user, second template in second orga', { name: 'Third instance' }, 1, 2, 2)

			.createEventSourceInstance('Create first event source instance for second user, first template in third orga', { name: 'Fourth instance' }, 2, 3, 1)
			.createEventSourceInstance('Create second event source instance for second user, third template in third orga', { name: 'Fifth instance' }, 2, 3, 3)

			.createActionTargetTemplate('Create first action target template for first user', { name: 'Action target template 1', public: true }, 1, 1)
			.createActionTargetTemplate('Create second action target template for first user', { name: 'Action target template 2', public: false }, 1, 2)

			.createActionTargetTemplate('Create first action target template for second user', { name: 'Action target template 3', public: false }, 2, 3)

			.createActionType('Create first action type for first template', { name: 'Radiator increase', type: 'http://iflux.io/schemas/actionTypes/1' }, 1, 1)
			.createActionType('Create second action type for first template', { name: 'Radiator decrease', type: 'http://iflux.io/schemas/actionTypes/2' }, 1, 1)
			.createActionType('Create first action type for second template', { name: 'Radiator change', type: 'http://iflux.io/schemas/actionTypes/3' }, 1, 2)

			.createActionType('Create first action type for third template', { name: 'Messaging' }, 2, 3)

			.createActionTargetInstance('Create first action target instance for first user, first template in first orga', { name: 'First instance' }, 1, 1, 1)
			.createActionTargetInstance('Create second action target instance for first user, first template in second orga', { name: 'Second instance' }, 1, 2, 1)
			.createActionTargetInstance('Create third action target instance for first user, second template in second orga', { name: 'Third instance' }, 1, 2, 2)

			.createActionTargetInstance('Create first action target instance for second user, first template in third orga', { name: 'Fourth instance' }, 2, 3, 1)
			.createActionTargetInstance('Create second action target instance for second user, third template in third orga', { name: 'Fifth instance' }, 2, 3, 3)
		;
	}
};