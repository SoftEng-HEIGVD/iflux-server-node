var
	_ = require('underscore'),
	color = require('colors'),
	knex = require('../../config/bookshelf').knex;

/**
 * DAO factory
 *
 * @param model The model to manipulate
 * @returns Object that acts as DAO
 */
module.exports = function(model) {
	return {
		model: model,
		knex: knex,

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
				if (_.isArray(whereClause)) {
					var qb = this.model;

					_.each(whereClause, function(clause) {
						if (_.isArray(clause)) {
							if (clause.length == 3) {
								qb = qb.where(clause[0], clause[1], clause[2]);
							}
							else {
								console.log('Unable to use the clause: %s'.red, clause);
							}
						}
						else {
							qb = qb.where(clause);
						}
					});

					return qb
						.fetchAll()
						.then(function (result) {
							return result.models;
						});
				}
				else {
					return this.model
						.where(whereClause)
						.fetchAll()
						.then(function (result) {
							return result.models;
						});
				}
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
		 * Find models by the ids provided.
		 *
		 * @param ids The array of ids.
		 * @returns {Promise}
		 */
		findByIds: function(ids) {
			return this.collection(function(qb) {
				return qb
					.whereIn('id', ids);
			});
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