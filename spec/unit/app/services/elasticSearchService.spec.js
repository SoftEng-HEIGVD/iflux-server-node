var
	_ = require('underscore'),
  elasticSearchServiceFactory = require('../../../../app/services/elasticSearchService.js');

describe('elasticSearchService', function() {
  var elasticSearch;
	var elasticSearchSpy;
  var elasticSearchService;

  beforeEach(function() {
	  elasticSearchSpy = {
      create: function() { return this; },
    };

	  spyOn(elasticSearchSpy, 'create').andCallThrough();

    elasticSearch = {
	    Client: function() { return elasticSearchSpy; }
    };

    elasticSearchService = elasticSearchServiceFactory(elasticSearch);
  });

	it ('should save an event', function() {
		var event = {
			timestamp: '2015-06-04H23:12:34.000Z',
			source: 'source',
			type: 'http://type',
			properties: {
				test: '123'
			}
		};

		elasticSearchService.saveEvent(event);

		expect(elasticSearchSpy.create).toHaveBeenCalledWith(
			{
				index: 'iflux-events',
				type: 'json',
				id: jasmine.any(String),
				body: {
					timestamp: '2015-06-04H23:12:34.000Z',
					source: 'source',
					type: 'http://type',
					properties: {
						test: '123'
					}
				}
			},
      jasmine.any(Function)
		);
	});

	it ('should save an event with big structure and multiple id fields', function() {
		var event = {
			timestamp: '2015-06-04H23:12:34.000Z',
			source: 'source',
			type: 'http://type',
			properties: {
				id: '123',
				deep1: {
					id: '456',
					deep2: {
						id: '789',
						deep3: {
							id: '012'
						}
					}
				}
			}
		};

		elasticSearchService.saveEvent(event);

		expect(elasticSearchSpy.create).toHaveBeenCalledWith(
			{
				index: 'iflux-events',
				type: 'json',
				id: jasmine.any(String),
				body: {
					timestamp: '2015-06-04H23:12:34.000Z',
					source: 'source',
					type: 'http://type',
					properties: {
						dbid: '123',
						deep1: {
							dbid: '456',
							deep2: {
								dbid: '789',
								deep3: {
									dbid: '012'
								}
							}
						}
					}
				}
			},
      jasmine.any(Function)
		);
	});

	it ('should save a matched event', function() {
		var event = {
			event:{
				timestamp: '2015-06-04H23:12:34.000Z',
					source: 'source',
				type: 'http://type',
				properties: {
				test: '123'
			}
		}
	};

		elasticSearchService.saveMatch(event);

		expect(elasticSearchSpy.create).toHaveBeenCalledWith(
			{
				index: 'iflux-event-matches',
				type: 'json',
				id: jasmine.any(String),
				body: {
					event: {
						timestamp: '2015-06-04H23:12:34.000Z',
						source: 'source',
						type: 'http://type',
						properties: {
							test: '123'
						}
					}
				}
			},
      jasmine.any(Function)
		);
	});

	it ('should save a match event with big structure and multiple id fields', function() {
		var event = {
			event: {
				timestamp: '2015-06-04H23:12:34.000Z',
				source: 'source',
				type: 'http://type',
				properties: {
					id: '123',
					deep1: {
						id: '456',
						deep2: {
							id: '789',
							deep3: [{
								id: '012'
							}, {
								id: '345'
							}]
						}
					}
				}
			}
		};

		elasticSearchService.saveMatch(event);

		expect(elasticSearchSpy.create).toHaveBeenCalledWith(
			{
				index: 'iflux-event-matches',
				type: 'json',
				id: jasmine.any(String),
				body: {
					event: {
						timestamp: '2015-06-04H23:12:34.000Z',
						source: 'source',
						type: 'http://type',
						properties: {
							dbid: '123',
							deep1: {
								dbid: '456',
								deep2: {
									dbid: '789',
									deep3: [{
										dbid: '012'
									}, {
										dbid: '345'
									}]
								}
							}
						}
					}
				}
			},
      jasmine.any(Function)
		);
	});

	it ('should save a match event with complex structure and multiple id fields', function() {
		var matchEvent = require('./matchedEvent.json');

		elasticSearchService.saveMatch(matchEvent);

		expect(elasticSearchSpy.create).toHaveBeenCalledWith(
			{
				index: 'iflux-event-matches',
				type: 'json',
				id: jasmine.any(String),
				body: require('./matchedEventExpected.json')
			},
      jasmine.any(Function)
		);
	});
});