'use strict';

exports.up = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.raw('ALTER TABLE rules ALTER COLUMN name SET NOT NULL'); })

	;
};

exports.down = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.raw('ALTER TABLE rules ALTER COLUMN name SET NULL'); })
	;
};
