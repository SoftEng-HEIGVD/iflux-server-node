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
		validationEnabled: true,

		initialize: function() {
			this.createValidations = reducer(this.validations, 'create');
			this.updateValidations = reducer(this.validations, 'update');

			this.on('creating', this.validateCreate);
			this.on('updating', this.validateUpdate);
			this.on('saved', this.restoreValidation);
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

				return checkit(this[options.mode + 'Validations']).run(this.attributes);
			}
		}
	});
};