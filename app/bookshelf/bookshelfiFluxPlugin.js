var
	_ = require('underscore'),
	checkit = require('checkit');

module.exports = function(Bookshelf) {
	"use strict";

	function reducer(validations, type) {
		return _.reduce(validations, function(newValidations, validationValues, validationName) {
			var validators = _.reduce(validationValues, function(newValidators, validator) {
				if (_.has(validator, 'on')) {
					if (validator.on == type) {
						delete validator.on;
						newValidators.push(validator);
					}
				}
				else {
					newValidators.push(validator);
				}

					return newValidators;
			}, []);

			if (validators.length > 0) {
				newValidations[validationName] = validators;
			}

			return newValidations;
		}, {});
	}

	Bookshelf.Model = Bookshelf.Model.extend({
		validations: {},
		conditionalValidations: {},
		validationEnabled: true,

		virtualValues: {},

		eventDefinitions: {},

		initialize: function() {
			this.createValidations = reducer(this.validations, 'create');
			this.updateValidations = reducer(this.validations, 'update');

			this.createConditionalValidations = [];
			this.updateConditionalValidations = [];

			_.each(this.conditionalValidations, function(conditionalValidationGroup) {
				this.createConditionalValidations.push({
					validations: reducer(conditionalValidationGroup.validations, 'create'),
					handler: conditionalValidationGroup.handler
				});
				this.updateConditionalValidations.push({
					validations: reducer(conditionalValidationGroup.validations, 'update'),
					handler: conditionalValidationGroup.handler
				});
			}, this);

			this.on('creating', this.validateCreate);
			this.on('updating', this.validateUpdate);
			this.on('saved', this.restoreValidation);

			_.each(this.eventDefinitions, function(eventHandlers, eventName) {
				_.each(eventHandlers, function(eventHandler) {
					this.on(eventName, eventHandler);
				}, this);
			}, this);
		},

		restoreValidation: function() {
			this.validationEnabled = true;
		},

		saveWithoutValidation: function() {
			this.validationEnabled = false;
			return this.save();
		},

		validateCreate: function() {
			return this.validate({ mode: 'create' });
		},

		validateUpdate: function() {
			return this.validate({ mode: 'update' });
		},

		validate: function(options) {
			if (this.validationEnabled) {
				if (!options.mode) {
					options.mode = 'create';
				}

				var validation = checkit(this[options.mode + 'Validations']);

				_.each(this[options.mode + 'ConditionalValidations'], function(conditionalValidations) {
					validation = validation.maybe(conditionalValidations.validations, conditionalValidations.handler);
				});

				return validation.run(_.extend(this, this.attributes), this);
			}
		}
	});
};