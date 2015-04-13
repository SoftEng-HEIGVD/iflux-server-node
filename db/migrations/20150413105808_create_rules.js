'use strict';

exports.up = function(knex, Promise) {
	return knex.schema.createTable('rules', function(table) {
		table.increments();
		table.string('description');
		table.string('reference');
		table.boolean('enabled');
		table.json('condition');
		table.json('action');
		table.timestamps();
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTable('rules');
};
