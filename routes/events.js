var express = require('express');
var router = express.Router();

var RuleEngine = require('../services/ruleengine');
var iFluxClient = require('iflux-node-client').Client;

var iFluxClient = new iFluxClient();

var ruleEngine = RuleEngine.ruleEngine;
                   

/**
 * POST /events is invoked by clients to notify that a list of events have occcured.
 * The body of the request is a list of events. Every event has a timestamp, a type,
 * a source and a list of properties
 *
 * @see {@link http://www.iflux.io/api/reference/#events|REST API Specification}
 */
router.post('/', function(req, res) {
  var events = req.body;
  for (var i=0; i<events.length; i++) {
    var actions = ruleEngine.processEvent(events[i]);
    console.log("Triggered " + actions.length + " actions.");
    for (var j=0; j<actions.length; j++) {
      var action = actions[j];      
      iFluxClient.executeAction(action);
    }
  }
  res.send('respond with a resource');
});


module.exports = router;
