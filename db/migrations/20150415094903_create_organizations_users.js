'use strict';

exports.up = function(knex, Promise) {
	return knex.schema.createTable('organizations', function(table) {
		table.increments('id').notNullable().primary();
		table.string('name').notNullable().unique();
		table.timestamps();
	}).createTable('users', function(table) {
		table.increments('id').notNullable().primary();
		table.string('email').notNullable().unique();
		table.string('passwordHash').notNullable();
		table.string('firstName');
		table.string('lastName');
		table.timestamps();
	}).createTable('organizations_users', function(table) {
		table.integer('organization_id').notNullable().references('organizations.id');
		table.integer('user_id').notNullable().references('users.id');
	});

};

exports.down = function(knex, Promise) {
	return knex.schema
		.dropTable('organizations_users')
		.dropTable('users')
		.dropTable('organizations');
};
