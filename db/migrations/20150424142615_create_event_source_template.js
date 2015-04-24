'use strict';

exports.up = function(knex, Promise) {
	return knex.schema.createTable('event_source_templates', function(table) {
		table.increments('id').primary();
		table.string('name').unique();
		table.json('configurationSchema');
		table.string('callbackUrl');
		table.string('callbackToken');
		table.boolean('public');
		table.integer('organization_id').references('organizations.id');
		table.timestamps();
	});

};

exports.down = function(knex, Promise) {
	return knex.schema
		.dropTable('event_source_templates');
};
