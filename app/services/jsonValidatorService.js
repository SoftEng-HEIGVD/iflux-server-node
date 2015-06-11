var
	_ = require('underscore'),
	s = require('underscore.string'),
	jsonSchemaValidator = require('jsonschema').Validator,
	checkit = require('checkit');

function validateFactory(jsonSchema) {
	return function(value) {
		var validator = new jsonSchemaValidator();

		var validationResult = validator.validate(value, jsonSchema);

		if (!validationResult.valid) {
			//var validationError = new checkit.FieldError('The JSON value contains ' + validationResult.errors.length + 'error' + (validationResult.errors.length < 2 ? '' : 's'));
			var checkitError = new checkit.Error();


			_.each(validationResult.errors, function (error) {
				var fieldName = error.property;

				if (s.startsWith(fieldName, 'instance')) {
					fieldName = fieldName.replace('instance', '');

					if (s.startsWith(fieldName, '.')) {
						fieldName = fieldName.substr(1);
					}

					if (s.startsWith(error.message, 'additionalProperty')) {
						var matches = /.*\'(.*)\'.*/.exec(error.message);
						if (matches[1]) {
							fieldName = fieldName + (fieldName.length > 0 ? '.' : '') + matches[1];
						}
					}

					if (s.startsWith(error.message, 'requires')) {
						var matches = /.*\"(.*)\".*/.exec(error.message);
						if (matches[1]) {
							fieldName = fieldName + (fieldName.length > 0 ? '.' : '') + matches[1];
						}
					}
				}

				var fieldError = new checkit.FieldError();
				fieldError.errors.push(new checkit.ValidationError(error.message));
				checkitError.errors[fieldName] = fieldError;
			});

			throw checkitError;
		}
	}
}

module.exports = {
	validate: function(obj, fieldName, jsonSchema) {
		var validationRules = {};

		validationRules[fieldName] = validateFactory(jsonSchema);

		var validation = checkit(validationRules);

		return validation.run(_.clone(obj));
	}
};