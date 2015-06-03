'use strict';

var request = require('request');

module.exports = function (grunt) {
	// show elapsed time at the end
	require('time-grunt')(grunt);
	// load all grunt tasks
	require('load-grunt-tasks')(grunt);

	var reloadPort = 35728, files;

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		develop: {
			server: {
				file: 'app.js'
			}
		},

		stylus: {
			dist: {
				files: {
					'public/css/style.css': 'public/css/style.styl'
				}
			}
		},

		jshint: {
			all: ['app.js', 'condig/**/*.js', 'lib/**/*.js', 'spec/**/*.js']
		},

		jasmine_node: {
			options: {
				forceExit: true,
				match: '.',
				matchall: false,
				useHelpers: true,
				extensions: 'js',
				specNameMatcher: 'spec',
				helperNameMatcher: 'helpers'
			},
			all: ['spec/unit'],
			unit: ['spec/unit'],
		},

		watch: {
			options: {
				nospawn: true,
				livereload: reloadPort
			},
			js: {
				files: [
					'app.js',
					'app/**/*.js',
					'config/*.js'
				],
				tasks: ['develop', 'delayed-livereload']
			},
			css: {
				files: [
					'public/css/*.styl'
				],
				tasks: ['stylus'],
				options: {
					livereload: reloadPort
				}
			},
			views: {
				files: [
					'app/views/*.jade',
					'app/views/**/*.jade'
				],
				options: {livereload: reloadPort}
			},
			tests: {
				files: [
					'lib/**/*.js',
					'spec/unit/**.js'
				],
				tasks: ['test']
			}
		},

		start_mockserver: {
			start: {
				options: {
					serverPort: 1080
				}
			}
		},

		stop_mockserver: {
			stop: {}
		}
	});

	grunt.config.requires('watch.js.files');
	files = grunt.config('watch.js.files');
	files = grunt.file.expand(files);

	grunt.registerTask('delayed-livereload', 'Live reload after the node server has restarted.', function () {
		var done = this.async();
		setTimeout(function () {
			request.get('http://localhost:' + reloadPort + '/changed?files=' + files.join(','), function (err, res) {
				var reloaded = !err && res.statusCode === 200;
				if (reloaded)
					grunt.log.ok('Delayed live reload successful.');
				else
					grunt.log.error('Unable to make a delayed live reload.');
				done(reloaded);
			});
		}, 500);
	});

	grunt.loadNpmTasks('grunt-jasmine-node');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('mockserver-grunt')

	grunt.registerTask('test', ['jshint', 'jasmine_node:unit']);

	grunt.registerTask('start-mock', [ 'start_mockserver' ]);
	grunt.registerTask('stop-mock', [ 'stop_mockserver' ]);

	grunt.registerTask('default', [
		'stylus',
		'test',
		'develop',
		'watch'
	]);
};
