var
	_ = require('underscore'),
  connectorFactory = require('../../../lib/connector.js');

describe("Connector", function() {
  var restClient;
	var restClientSpy;
  var Connector;
	var bluebird;

  var npmlog;

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

    npmlog = {
	    info: jasmine.createSpy()
    };

    Connector = connectorFactory(restClient, npmlog, bluebird);
  });

	it ("should execute an action with an array of actions", function() {
		var connector = new Connector();

		spyOn(connector, 'executeActions').andCallThrough();

		var action = {
			target: 'http://actionTarget/actions',
			payload: {
				test: 1
			}
		};

		connector.executeAction(action);

		expect(restClientSpy.post).toHaveBeenCalledWith(
			'http://actionTarget/actions', {
				data: [ { test: 1 } ],
				headers: { "Content-Type": "application/json" }
			},
      jasmine.any(Function)
		);
		expect(connector.executeActions).toHaveBeenCalled();
	});

	it ("should execute actions", function() {
		var connector = new Connector();

		var actions = [{
			target: 'http://actionTarget1/actions',
			payload: {
				test: 1
			}
		}, {
			target: 'http://actionTarget2/actions',
			payload: {
				test: 2
			}
		}, {
			target: 'http://actionTarget2/actions',
			payload: {
				test: 3
			}
		}];

		connector.executeActions(actions);

		expect(restClientSpy.post).toHaveBeenCalledWith(
			'http://actionTarget1/actions', {
				data: [ { test: 1 } ],
				headers: { "Content-Type": "application/json" }
			},
      jasmine.any(Function)
		);
		expect(restClientSpy.post).toHaveBeenCalledWith(
			'http://actionTarget2/actions', {
				data: [ { test: 2 }, { test: 3 } ],
				headers: { "Content-Type": "application/json" }
			},
      jasmine.any(Function)
		);
	});

	it ("should not configure an event source when there is no URL.", function() {
		var connector = new Connector();

		connector.configureEventSource({}, {});

		expect(npmlog.info).toHaveBeenCalledWith('There is nothing to configure. Configuration URL is missing.');
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
			configurationUrl: 'somewhere'
		}, {
			eventSourceId: 'abcdef',
			configuration: {
				test: 2
			}
		});

		expect(result).toEqual({ test: 1 });
		expect(restClientSpy.post).toHaveBeenCalledWith(
			'somewhere', {
				data: {
					eventSourceId: 'abcdef',
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
			configurationUrl: 'somewhere',
			configurationToken: '1234'
		}, {
			eventSourceId: 'abcdef',
			configuration: {
				test: 2
			}
		});

		expect(result).toEqual({ test: 1 });
		expect(restClientSpy.post).toHaveBeenCalledWith(
			'somewhere', {
				data: {
					eventSourceId: 'abcdef',
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

		connector.configureActionTarget({}, {});

		expect(npmlog.info).toHaveBeenCalledWith('There is nothing to configure. Configuration URL is missing.');
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
			configurationUrl: 'somewhere'
		}, {
			actionTargetId: 'abcdef',
			configuration: {
				test: 2
			}
		});

		expect(result).toEqual({ test: 1 });
		expect(restClientSpy.post).toHaveBeenCalledWith(
			'somewhere', {
				data: {
					actionTargetId: 'abcdef',
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
			configurationUrl: 'somewhere',
			configurationToken: '1234'
		}, {
			actionTargetId: 'abcdef',
			configuration: {
				test: 2
			}
		});

		expect(result).toEqual({ test: 1 });
		expect(restClientSpy.post).toHaveBeenCalledWith(
			'somewhere', {
				data: {
					actionTargetId: 'abcdef',
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