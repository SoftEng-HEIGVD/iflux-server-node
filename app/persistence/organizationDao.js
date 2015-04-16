var
	_ = require('underscore'),
	Organization = require('../services/modelRegistry').organization,
	dao = require('./dao');

module.exports = _.extend(new dao(Organization), {
	/**
	 * Create a new organization and save it to the database
	 *
	 * @param organization The organization to create and save
	 * @returns {Promise} A promise
	 */
	createAndSave: function(organization) {
		var orga = new this.model({
			name: organization.name
		});

		return this.save(orga);
	}
});