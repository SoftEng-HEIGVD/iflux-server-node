var
	_ = require('underscore'),
	elasticSearchService = require('../../lib/ioc').create('elasticSearchService'),
	ruleEngineService = require('./ruleEngineService'),
	timeService = require('./timeService');

module.exports = {
  eventsHandler: function(events) {
    var time = timeService.timestamp();

    if (!_.isArray(events)) {
      events = [ events ];
    }

    console.log('Received %s event(s).', events.length);

    _.each(events, function(event) {
      if (event) {
        event.receivedAt = time;
        elasticSearchService.saveEvent(event);
      }
      else {
        console.log('Something strange happens to the event: %s', event);
        console.log(events);
      }
    });

    ruleEngineService.match(events);
  }
};