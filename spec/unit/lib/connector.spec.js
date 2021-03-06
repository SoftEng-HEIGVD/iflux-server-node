var
	_ = require('underscore'),
  connectorFactory = require('../../../lib/connector.js');

describe("Connector", function() {
  var restClient;
	var restClientSpy;
  var Connector;
	var bluebird;

  beforeEach(function() {
	  restClientSpy = {
      post: function() { return this; },
		  on: function() {}
    };

	  spyOn(restClientSpy, 'post').andCallThrough();
	  spyOn(restClientSpy, 'on').andCallThrough();

    restClient = {
	    Client: function() { return restClientSpy; }
    };

	  bluebird = {
		  defer: jasmine.createSpy()
	  };

	  var print = jasmine.createSpy();

    Connector = connectorFactory(restClient, bluebird, print);
  });

	it ("should execute an action with an array of actions", function() {
		var connector = new Connector();

		spyOn(connector, 'executeActions').andCallThrough();

		var action = {
			targetUrl: 'http://actionTarget/actions',
			target: 'abcdef',
			type: 'http://someTypeId',
			properties: {
				test: 1
			}
		};

		connector.executeAction(action);

		expect(restClientSpy.post).toHaveBeenCalledWith(
			'http://actionTarget/actions', {
				data: [ { target: 'abcdef', type: 'http://someTypeId', properties: { test: 1 }} ],
				headers: { "Content-Type": "application/json" }
			},
      jasmine.any(Function)
		);
		expect(connector.executeActions).toHaveBeenCalled();
	});

	it ("should execute an action with a token", function() {
		var connector = new Connector();

		spyOn(connector, 'executeActions').andCallThrough();

		var action = {
			targetUrl: 'http://actionTarget/actions',
			targetToken: 'token',
			target: 'abcdef',
			type: 'http://someTypeId',
			properties: {
				test: 1
			}
		};

		connector.executeAction(action);

		expect(restClientSpy.post).toHaveBeenCalledWith(
			'http://actionTarget/actions', {
				data: [ { target: 'abcdef', type: 'http://someTypeId', properties: { test: 1 }} ],
				headers: {
					"Content-Type": "application/json",
					"Authorization": "bearer token"
				}
			},
      jasmine.any(Function)
		);
		expect(connector.executeActions).toHaveBeenCalled();
	});

	it ("should execute actions", function() {
		var connector = new Connector();

		var actions = [{
			targetUrl: 'http://actionTarget1/actions',
			target: 'abcdef',
			type: 'http://someTypeId',
			properties: {
				test: 1
			}
		}, {
			targetUrl: 'http://actionTarget2/actions',
			target: 'abcdef',
			type: 'http://someTypeId',
			properties: {
				test: 2
			}
		}, {
			targetUrl: 'http://actionTarget2/actions',
			target: 'abcdef',
			type: 'http://someTypeId',
			properties: {
				test: 3
			}
		}];

		connector.executeActions(actions);

		expect(restClientSpy.post).toHaveBeenCalledWith(
			'http://actionTarget1/actions', {
				data: [ {
					target: 'abcdef',
					type: 'http://someTypeId',
				  properties: {
					  test: 1
				  }
				} ],
				headers: { "Content-Type": "application/json" }
			},
      jasmine.any(Function)
		);
		expect(restClientSpy.post).toHaveBeenCalledWith(
			'http://actionTarget2/actions', {
				data: [{
					target: 'abcdef',
					type: 'http://someTypeId',
					properties: {
						test: 2
					}
				}, {
					target: 'abcdef',
					type: 'http://someTypeId',
					properties: {
						test: 3
					}
				}],
				headers: { "Content-Type": "application/json" }
			},
      jasmine.any(Function)
		);
	});

	it ("should not configure an event source when there is no URL.", function() {
		var connector = new Connector();

		bluebird.defer.andCallFake(function() {
			return {
				resolve: function() {}
			};
		});

		connector.configureEventSource({ get: function() { return undefined; }}, {});
	});

	it ("should configure event source.", function() {
		var connector = new Connector();

		bluebird.defer.andCallFake(function() {
			return {
				resolve: function() {},
				promise: { test: 1 }
			};
		});

		var result = connector.configureEventSource({
			get: function(str) { return this[str]; },
			configurationUrl: 'somewhere'
		}, {
			get: function(str) { return this[str]; },
			generatedIdentifier: 'abcdef',
			configuration: {
				test: 2
			}
		});

		expect(result).toEqual({ test: 1 });
		expect(restClientSpy.post).toHaveBeenCalledWith(
			'somewhere', {
				data: {
					source: 'abcdef',
					properties: {
						test: 2
					}
				},
				headers: {
					"Content-Type": "application/json"
				}
			},
			jasmine.any(Function)
		);

		expect(restClientSpy.on).toHaveBeenCalled();
	});

	it ("should configure event source with token.", function() {
		var connector = new Connector();

		bluebird.defer.andCallFake(function() {
			return {
				resolve: function() {},
				promise: { test: 1 }
			};
		});

		var result = connector.configureEventSource({
			get: function(str) { return this[str]; },
			configurationUrl: 'somewhere',
			configurationToken: '1234'
		}, {
			get: function(str) { return this[str]; },
			generatedIdentifier: 'abcdef',
			configuration: {
				test: 2
			}
		});

		expect(result).toEqual({ test: 1 });
		expect(restClientSpy.post).toHaveBeenCalledWith(
			'somewhere', {
				data: {
					source: 'abcdef',
					properties: {
						test: 2
					}
				},
				headers: {
					"Content-Type": "application/json",
					"Authorization": 'bearer 1234'
				}
			},
			jasmine.any(Function)
		);

		expect(restClientSpy.on).toHaveBeenCalled();
	});

	it ("should not configure an action target when there is no URL.", function() {
		var connector = new Connector();

		bluebird.defer.andCallFake(function() {
			return {
				resolve: function() {}
			};
		});

		connector.configureActionTarget({ get: function() { return undefined; }}, {});
	});


	it ("should configure action target.", function() {
		var connector = new Connector();

		bluebird.defer.andCallFake(function() {
			return {
				resolve: function() {},
				promise: { test: 1 }
			};
		});

		var result = connector.configureActionTarget({
			get: function(str) { return this[str]; },
			configurationUrl: 'somewhere'
		}, {
			get: function(str) { return this[str]; },
			generatedIdentifier: 'abcdef',
			configuration: {
				test: 2
			}
		});

		expect(result).toEqual({ test: 1 });
		expect(restClientSpy.post).toHaveBeenCalledWith(
			'somewhere', {
				data: {
					target: 'abcdef',
					properties: {
						test: 2
					}
				},
				headers: {
					"Content-Type": "application/json"
				}
			},
			jasmine.any(Function)
		);

		expect(restClientSpy.on).toHaveBeenCalled();
	});

	it ("should configure action target with token.", function() {
		var connector = new Connector();

		bluebird.defer.andCallFake(function() {
			return {
				resolve: function() {},
				promise: { test: 1 }
			};
		});

		var result = connector.configureActionTarget({
			get: function(str) { return this[str]; },
			configurationUrl: 'somewhere',
			configurationToken: '1234'
		}, {
			get: function(str) { return this[str]; },
			generatedIdentifier: 'abcdef',
			configuration: {
				test: 2
			}
		});

		expect(result).toEqual({ test: 1 });
		expect(restClientSpy.post).toHaveBeenCalledWith(
			'somewhere', {
				data: {
					target: 'abcdef',
					properties: {
						test: 2
					}
				},
				headers: {
					"Content-Type": "application/json",
					"Authorization": 'bearer 1234'
				}
			},
			jasmine.any(Function)
		);

		expect(restClientSpy.on).toHaveBeenCalled();
	});
});