var Handlebars = require('handlebars');

var lastRuleId = 1;

/**
 * This constructor will be used to create and export a singleton. The Rule Engine maintains a list of rules and
 * a list of actions. When events are notified, the Rule Engine is asked to evaluate the rules to decide whether
 * actions should be triggered.
 */
var RuleEngine = function() {
  
  /*
   * This private array contains the list of rules.
   */
  var rules = [];
  
  /**
   * Processes an event, by evaluating the list of rules
   *
   * @param {object} event - the incoming event that might trigger some rules
   * @returns {array} a list of actions to execute in reaction to the event occurrence
   */
  var processEvent = function(event) {
    var actions = [];
    for (var i=0; i<rules.length; i++) {
      var rule = rules[i];
      rule.evaluate(event, actions);
    };
    return actions;
  };
  
  /**
   * Adds a rule. A unique id is assigned.
   *
   * @param {object} rule - the rule to add in the list managed by the rule engine
   * @returns {number} the unique id assigned to the rule
   */
  var addRule = function(rule) {
    var ruleId = (lastRuleId++).toString();
    rule.id = ruleId;
    rules.push(rule);
    return ruleId;
  };
  
  /**
   * Get the list of rules.
   *
   * @returns {array} - a copy of the rules
   */
  var getRules = function() {
    return rules.slice(0);
  };
  
  /**
   * Get the list of rule definitions.
   *
   * @returns {array} - a copy of the rules
   */
  var getRuleDefinitions = function() {
    return rules.map(function(rule) {
      var result = rule.ruleDefinition;
      result.id = rule.id;
      return result;
    });
  };

  /**
   * Delete one rule, identified by its unique id.
   *
   * @param {string} ruleId - the unique id assigned to the rule to be deleted
   */
  var deleteRule = function(ruleId) {
    for (var i=0; i<rules.length; i++) {
      if (rules[i].id === ruleId) {
        rules.splice(i, 1);
      }
    }
  };
  
  return {
    processEvent : processEvent,
    addRule : addRule,
    getRules : getRules,
    getRuleDefinitions: getRuleDefinitions,
    deleteRule : deleteRule
  };
  
};

/**
 * A Rule is defined by an event type, a list of conditions (evaluated against the event properties)
 * and an action. When an event is notified, if its type matches the one of the rule and if the conditions
 * are met, then the action is triggered.
 *
 * @constructor
 * @param {object} ruleDefinition - the rule definition (used as a payload in the REST requests)
 */
var Rule = function(ruleDefinition) {
  this.ruleDefinition = ruleDefinition;
  var target = ruleDefinition.then.actionTarget;
  var schema = ruleDefinition.then.actionSchema;
  this.action = new Action(target, schema);
};

/**
 * This function evaluates a rule against an event. If the rule is evaluated positivey, then
 * an action is added in the actions array argument
 * @param {object} event - the incoming event that might trigger the rule
 * @param {array} actions - an array of actions; if the evaluation is positive, an action is added to this array
 */
Rule.prototype.evaluate = function(event, actions) {
  console.log("Evaluating rule: " + this.ruleDefinition.description);
  /*
   * 1. Check the condition on the event source
   */
  if ("*" !== this.ruleDefinition.if.eventSource && event.source !== this.ruleDefinition.if.eventSource) {
    console.log("Event source does not match, exit evaluation");
    return;
  }

  /*
   * 2. Check the condition on the event type
   */
  if ("*" !== this.ruleDefinition.if.eventType && event.type !== this.ruleDefinition.if.eventType) {
    console.log("Event type does not match, exit evaluation");
    return;
  }

  /*
   * 3. Check the conditions on the event properties
   */

  /*
   * All conditions are met, add an action to trigger
   */
  console.log("All conditions are met, trigger action.");
  actions.push(this.action.generate(event));

};

/**
 *
 */
var Action = function(target, transformationTemplate) {
  this.target = target;
  this.transformationTemplate = transformationTemplate;
  this.transformation = Handlebars.compile(transformationTemplate);
};

Action.prototype.generate = function(event) {
  var action = this.transformation(event);
  var actionObject = JSON.parse(action);
  return {
    target : this.target,
    payload : actionObject
  };
};

module.exports.ruleEngine = new RuleEngine();
module.exports.Rule = Rule;
module.exports.Action = Action;