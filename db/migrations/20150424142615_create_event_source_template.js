'use strict';

exports.up = function(knex, Promise) {
	return knex.schema.createTable('event_source_templates', function(table) {
		table.increments('id').notNullable().primary();
		table.string('name').notNullable();
		table.json('configurationSchema');
		table.string('callbackUrl');
		table.string('callbackToken');
		table.boolean('public').notNullable();
		table.integer('organization_id').notNullable().references('organizations.id');
		table.timestamps();

		table.unique([ 'organization_id', 'name' ]);
	});

};

exports.down = function(knex, Promise) {
	return knex.schema
		.dropTable('event_source_templates');
};
