$(function () {

  var eventEditor = ace.edit("eventEditor");
  eventEditor.setTheme("ace/theme/idle_fingers");
  eventEditor.getSession().setMode("ace/mode/json");
  eventEditor.setShowPrintMargin(false);
  eventEditor.setValue(JSON.stringify(JSON.parse(eventEditor.getValue()), null, '\t'));
  eventEditor.clearSelection();
  
  var schemaEditor = ace.edit("schemaEditor");
  schemaEditor.setTheme("ace/theme/idle_fingers");
  schemaEditor.getSession().setMode("ace/mode/json");
  schemaEditor.setShowPrintMargin(false);
  schemaEditor.getSession().setUseWrapMode(true);
  schemaEditor.setValue(JSON.stringify(JSON.parse(schemaEditor.getValue()), null, '\t'));
  schemaEditor.clearSelection();
  //schemaEditor.on("change", compute );
  
  var actionEditor = ace.edit("actionEditor");
  actionEditor.setTheme("ace/theme/kuroir");
  actionEditor.getSession().setMode("ace/mode/json");
  actionEditor.setShowPrintMargin(false);
  actionEditor.getSession().setUseWrapMode(true);
  var template = Handlebars.compile(schemaEditor.getValue());
  var action = JSON.parse(template(JSON.parse(eventEditor.getValue())));
  actionEditor.setValue(JSON.stringify(action, null, '\t'));
  actionEditor.clearSelection();
  actionEditor.setReadOnly(true);
  //actionEditor.renderer.setShowGutter(false);

  var apiRequestEditor = ace.edit("apiRequestEditor");
  apiRequestEditor.setTheme("ace/theme/kuroir");
  apiRequestEditor.getSession().setMode("ace/mode/json");
  apiRequestEditor.setShowPrintMargin(false);
  apiRequestEditor.getSession().setUseWrapMode(true);
  apiRequestEditor.setReadOnly(true);

  function compute() {
    var template = Handlebars.compile(schemaEditor.getValue());
    var action = JSON.parse(template(JSON.parse(eventEditor.getValue())));
    actionEditor.setValue(JSON.stringify(action, null, '\t'));
    actionEditor.clearSelection();
  };

  function generatePostRuleRequest() {
    var payload = {};
    payload.description = $("#tfRuleDescription").val();
    payload.if = {};
    payload.if.eventSource = $("#tfEventSource").val();
    payload.if.eventType = $("#tfEventType").val();
    payload.if.eventProperties = {};
    payload.then = {};
    payload.then.actionTarget = $("#tfActionTarget").val();
    payload.then.actionSchema = JSON.stringify(JSON.parse(schemaEditor.getValue()));
    return payload;
  }
  
  $("#bRecompute").click(function () {
    compute();
    apiRequestEditor.setValue(JSON.stringify(generatePostRuleRequest(), null, "\t"));
    apiRequestEditor.clearSelection();
  });
  
  $("#bSampleEventSourceThermometer").click(function () {
    $("#tfEventSource").val("https://api.iflux.com/eventSources/JKEJ8282");
  });
  
  $("#bSampleEventSourceAny").click(function () {
    $("#tfEventSource").val("*");
  });
});