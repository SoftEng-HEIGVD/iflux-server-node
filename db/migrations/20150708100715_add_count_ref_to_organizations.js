'use strict';

exports.up = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.schema.table('organizations', function (table) { return table.integer('refCount'); }); })
	;
};

exports.down = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.schema.table('organizations', function(table) { return table.dropColumn('refCount'); }); })
	;
};
