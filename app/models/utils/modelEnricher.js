module.exports = {
	addOrganizationEventHandlers: function(entity) {
		entity.on('created', function(model, attrs, options) {
			if (model.get('organization_id')) {
				model.organization()
					.fetch()
					.then(function(organization) {
						return organization.increaseReferenceCount();
					});
			}
		});

		entity.on('destroying', function(model, attrs, options) {
			if (model.get('organization_id')) {
				model.organization()
					.fetch()
					.then(function(organization) {
						return organization.decreaseReferenceCount();
					});
			}
		});
 	}
};