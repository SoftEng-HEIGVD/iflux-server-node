var _ = require('underscore');

/**
 * DAO factory
 *
 * @param model The model to manipulate
 * @returns Object that acts as DAO
 */
module.exports = function(model) {
	return {
		model: model,

		/**
		 * Save a model through the Bookshelf API
		 *
		 * @param obj The model to save
		 * @returns {Promise} A promise
		 */
		save: function (obj) {
			return obj.save();
		},

		/**
		 * Retrieve the collection for a query represented by a promise
		 *
		 * @param promise The promise that do the querying job
		 * @returns {Promise} A promise that return the collection of retrieved items
		 */
		collection: function(promise) {
			return this.model
				.query(promise)
				.fetchAll()
				.then(function(result) {
					return result.models;
				});
		},

		/**
		 * Retrieve all the elements of a collection based on the model
		 *
		 * @returns {Promise} A promise that return the collection of retrieved items
		 */
		collectionFromModel: function(whereClause) {
			if (whereClause) {
				return this.model
					.where(whereClause)
					.fetchAll()
					.then(function(result) {
						return result.models;
					});
			}
			else {
				return this.model
					.fetchAll()
					.then(function (result) {
						return result.models;
					});
			}
		},

		/**
		 * Retrieve all the element from a relation
		 *
		 * @param relation The relation to get the elements
		 * @returns {Promise} A promise that return the collection of retrieved items from the relation
		 */
		collectionFromRelation: function(relation) {
			return relation.fetch().then(function (result) {
				return result.models;
			});
		},

		/**
		 * Find by attributes
		 *
		 * @param attributes The attributes to match
		 * @returns {Promise} A promise
		 */
		findBy: function(attributes) {
			return new this.model(attributes).fetch();
		},

		/**
		 * Find a model by its id
		 *
		 * @param id The id of the model
		 * @returns {Promise} A promise
		 */
		findById: function(id) {
			return this.model.where({ id: id }).fetch({ require: true });
		},

		/**
		 * Find all models
		 *
		 * @returns {Promise} A promise
		 */
		findAll: function() {
			// TODO: Evaluate if the result should be returned or not
			return this.collectionFromModel();
		},

		/**
		 * Delete a model through the Bookshelf API
		 *
		 * @param id the ID of the model
		 * @returns {Promise} A promise
		 */
		deleteById: function (id) {
			return this.model.where({id: id}).destroy(id);
		}
	}
};