'use strict';

var
	_ = require('underscore'),
	bookshelf = require('../../config/bookshelf'),
	Rule = require('../../app/models/models').rule;

//1,"Publibike movements","Broadcast publibike movements.",true,"[
// {""description"":""Detect bike movements"",
// ""eventTypeId"":1,
// ""eventType"":""http://localhost:3000/schemas/eventTypes/publibikeMovement""}]","
// [{""description"":""Notify a change in station to allow a visualization."",""actionTargetId"":2,""actionTargetKey"":""GOyAwvt3K3Jb"",""actionTypeId"":2,""actionType"":""http://localhost:3000/schemas/actionTypes/viewMarker"",""eventTypeId"":1,""eventType"":""http://localhost:3000/schemas/eventTypes/publibikeMovement"",""fn"":""return { markerId: event.properties.terminal.terminalid, lat: event.properties.terminal.lat, lng: event.properties.terminal.lng, date: event.timestamp, data: { type: 'bike', name: event.properties.terminal.name, street: event.properties.terminal.street, city: event.properties.terminal.street, zip: event.properties.terminal.zip, freeholders: event.properties.new.freeholders, bikes: event.properties.new.bikes }};"",""sampleEvent"":{""terminalid"":""asdfghjkl"",""terminal"":{""name"":""Y-Parc"",""infotext"":""Parc Scientifique - Yverdon"",""zip"":""1400"",""city"":""Yverdon-les-Bains"",""country"":""Switzerland"",""lat"":46.764968,""lng"":6.646069,""image"":""""},""old"":{""freeholders"":10,""bikes"":3},""new"":{""freeholders"":11,""bikes"":2}}},{""description"":""Update free holders metric for each station."",""actionTargetId"":3,""actionTargetKey"":""juMV3NNTuxq3"",""actionTypeId"":3,""actionType"":""http://localhost:3000/schemas/actionTypes/updateMetric"",""eventTypeId"":1,""eventType"":""http://localhost:3000/schemas/eventTypes/publibikeMovement"",""fn"":""return { metric: 'io.iflux.publibike.holders.' + event.properties.terminal.terminalid, value: event.properties.new.freeholders, timestamp: event.timestamp };"",""sampleEvent"":{""terminalid"":""asdfghjkl"",""terminal"":{""name"":""Y-Parc"",""infotext"":""Parc Scientifique - Yverdon"",""zip"":""1400"",""city"":""Yverdon-les-Bains"",""country"":""Switzerland"",""lat"":46.764968,""lng"":6.646069,""image"":""""},""old"":{""freeholders"":10,""bikes"":3},""new"":{""freeholders"":11,""bikes"":2}}},{""description"":""Update bikes metric for each station."",""actionTargetId"":3,""actionTargetKey"":""juMV3NNTuxq3"",""actionTypeId"":3,""actionType"":""http://localhost:3000/schemas/actionTypes/updateMetric"",""eventTypeId"":1,""eventType"":""http://localhost:3000/schemas/eventTypes/publibikeMovement"",""fn"":""return { metric: 'io.iflux.publibike.bikes.' + event.properties.terminal.terminalid, value: event.properties.new.bikes, timestamp: event.timestamp };"",""sampleEvent"":{""terminalid"":""asdfghjkl"",""terminal"":{""name"":""Y-Parc"",""infotext"":""Parc Scientifique - Yverdon"",""zip"":""1400"",""city"":""Yverdon-les-Bains"",""country"":""Switzerland"",""lat"":46.764968,""lng"":6.646069,""image"":""""},""old"":{""freeholders"":10,""bikes"":3},""new"":{""freeholders"":11,""bikes"":2}}}]",1,"2015-06-24 15:49:22.086000","2015-06-24 15:49:22.086000"
//3,"Citizen operations","Broadcast Citizen Operations.",true,"[{""description"":""Detects issue creation."",""eventTypeId"":2,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenIssue""},{""description"":""Detects issue status changes."",""eventTypeId"":3,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenStatus""},{""description"":""Detects actions performed on issues."",""eventTypeId"":4,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenAction""}]","[{""description"":""Update the visualization of the issue creation on MapBox."",""actionTargetId"":7,""actionTargetKey"":""tA29FJh2kThm"",""actionTypeId"":2,""actionType"":""http://localhost:3000/schemas/actionTypes/viewMarker"",""eventTypeId"":2,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenIssue"",""fn"":""return { markerId: event.properties.issueId, lat: event.properties.lat, lng: event.properties.lng, date: event.properties.createdOn, data: { type: 'citizen', description: event.properties.description, imageUrl: event.properties.imageUrl, state: event.properties.state, owner: event.properties.creator, createdOn: event.properties.createdOn, updatedOn: event.properties.updatedOn, issueTypeCode: event.properties.issueTypeCode }};"",""sampleEvent"":{""issueId"":""asdgdgqwrasd"",""imageUrl"":"""",""creator"":""Henri Dupont"",""description"":""Something went wrong"",""state"":""created"",""issueTypeCode"":""cdn"",""lat"":1.2345,""lng"":6.789,""createdOn"":""2015-05-12H12:34:56:000Z"",""updatedOn"":""2015-05-12H12:34:56:000Z""}},{""description"":""Update the visualization of the issue status change on MapBox."",""actionTargetId"":7,""actionTargetKey"":""tA29FJh2kThm"",""actionTypeId"":2,""actionType"":""http://localhost:3000/schemas/actionTypes/viewMarker"",""eventTypeId"":3,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenStatus"",""fn"":""return { markerId: event.properties.issueId, lat: event.properties.lat, lng: event.properties.lng, date: event.properties.createdOn, data: { type: 'citizen', description: event.properties.description, imageUrl: event.properties.imageUrl, state: event.properties.state, owner: event.properties.creator, createdOn: event.properties.createdOn, updatedOn: event.properties.updatedOn, issueTypeCode: event.properties.issueTypeCode }};"",""sampleEvent"":{""issueId"":""asdgdgqwrasd"",""imageUrl"":"""",""creator"":""Henri Dupont"",""description"":""Something went wrong"",""state"":""created"",""issueTypeCode"":""cdn"",""lat"":1.2345,""lng"":6.789,""createdOn"":""2015-05-12H12:34:56:000Z"",""updatedOn"":""2015-05-12H12:34:56:000Z""}},{""description"":""Update the global metric that account the actions for all issues."",""actionTargetId"":3,""actionTargetKey"":""juMV3NNTuxq3"",""actionTypeId"":3,""actionType"":""http://localhost:3000/schemas/actionTypes/updateMetric"",""eventTypeId"":4,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenAction"",""fn"":""return { metric: 'ch.heigvd.ptl.sc.ce.actions.' + event.properties.type, timestamp: event.timestamp };"",""sampleEvent"":{""type"":""created""}},{""description"":""Update the global metric that account the issue creations for all issues."",""actionTargetId"":3,""actionTargetKey"":""juMV3NNTuxq3"",""actionTypeId"":3,""actionType"":""http://localhost:3000/schemas/actionTypes/updateMetric"",""eventTypeId"":2,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenIssue"",""fn"":""return { metric: 'ch.heigvd.ptl.sc.ce.issues.creation', timestamp: event.timestamp };"",""sampleEvent"":{}}]",1,"2015-06-24 15:49:22.171000","2015-06-24 15:49:22.171000"
//5,"Citizen operations for Yverdon","Broadcast Citizen Operations for Yverdon.",true,"[{""description"":""Detects issue creation."",""eventSourceId"":2,""eventSourceKey"":""r2b60fIAm0O9"",""eventTypeId"":2,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenIssue""},{""description"":""Detects issue status changes."",""eventSourceId"":2,""eventSourceKey"":""r2b60fIAm0O9"",""eventTypeId"":3,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenStatus""},{""description"":""Detects actions performed on issues."",""eventSourceId"":2,""eventSourceKey"":""r2b60fIAm0O9"",""eventTypeId"":4,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenAction""}]","[{""description"":""Update the visualization of the issue creation in Yverdon on MapBox."",""actionTargetId"":4,""actionTargetKey"":""BTgdQm8jlJfX"",""actionTypeId"":2,""actionType"":""http://localhost:3000/schemas/actionTypes/viewMarker"",""eventTypeId"":2,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenIssue"",""fn"":""return { markerId: event.properties.issueId, lat: event.properties.lat, lng: event.properties.lng, date: event.properties.createdOn, data: { type: 'citizen', description: event.properties.description, imageUrl: event.properties.imageUrl, state: event.properties.state, owner: event.properties.creator, createdOn: event.properties.createdOn, updatedOn: event.properties.updatedOn, issueTypeCode: event.properties.issueTypeCode }};"",""sampleEvent"":{""issueId"":""asdgdgqwrasd"",""imageUrl"":"""",""creator"":""Henri Dupont"",""description"":""Something went wrong"",""state"":""created"",""issueTypeCode"":""cdn"",""lat"":1.2345,""lng"":6.789,""createdOn"":""2015-05-12H12:34:56:000Z"",""updatedOn"":""2015-05-12H12:34:56:000Z""}},{""description"":""Update the visualization of the issue status change in Yverdon on MapBox."",""actionTargetId"":4,""actionTargetKey"":""BTgdQm8jlJfX"",""actionTypeId"":2,""actionType"":""http://localhost:3000/schemas/actionTypes/viewMarker"",""eventTypeId"":3,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenStatus"",""fn"":""return { markerId: event.properties.issueId, lat: event.properties.lat, lng: event.properties.lng, date: event.properties.createdOn, data: { type: 'citizen', description: event.properties.description, imageUrl: event.properties.imageUrl, state: event.properties.state, owner: event.properties.creator, createdOn: event.properties.createdOn, updatedOn: event.properties.updatedOn, issueTypeCode: event.properties.issueTypeCode }};"",""sampleEvent"":{""issueId"":""asdgdgqwrasd"",""imageUrl"":"""",""creator"":""Henri Dupont"",""description"":""Something went wrong"",""state"":""created"",""issueTypeCode"":""cdn"",""lat"":1.2345,""lng"":6.789,""createdOn"":""2015-05-12H12:34:56:000Z"",""updatedOn"":""2015-05-12H12:34:56:000Z""}},{""description"":""Update the global metric that account the actions for Yverdon issues."",""actionTargetId"":3,""actionTargetKey"":""juMV3NNTuxq3"",""actionTypeId"":3,""actionType"":""http://localhost:3000/schemas/actionTypes/updateMetric"",""eventTypeId"":4,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenAction"",""fn"":""return { metric: 'ch.heigvd.ptl.sc.ce.yverdon.actions.' + event.properties.type, timestamp: event.timestamp };"",""sampleEvent"":{""type"":""created""}},{""description"":""Update the global metric that account the issue creations for Yverdon issues."",""actionTargetId"":3,""actionTargetKey"":""juMV3NNTuxq3"",""actionTypeId"":3,""actionType"":""http://localhost:3000/schemas/actionTypes/updateMetric"",""eventTypeId"":2,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenIssue"",""fn"":""return { metric: 'ch.heigvd.ptl.sc.ce.yverdon.issues.creation', timestamp: event.timestamp };"",""sampleEvent"":{}}]",1,"2015-06-24 15:49:22.271000","2015-06-24 15:49:22.271000"
//6,"Citizen operations for Baulmes","Broadcast Citizen Operations for Baulmes.",true,"[{""description"":""Detects issue creation."",""eventSourceId"":3,""eventSourceKey"":""YyCf8GYXBiGU"",""eventTypeId"":2,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenIssue""},{""description"":""Detects issue status changes."",""eventSourceId"":3,""eventSourceKey"":""YyCf8GYXBiGU"",""eventTypeId"":3,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenStatus""},{""description"":""Detects actions performed on issues."",""eventSourceId"":3,""eventSourceKey"":""YyCf8GYXBiGU"",""eventTypeId"":4,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenAction""}]","[{""description"":""Update the visualization of the issue creation in Baulmes on MapBox."",""actionTargetId"":5,""actionTargetKey"":""RiZWXUxTIL9K"",""actionTypeId"":2,""actionType"":""http://localhost:3000/schemas/actionTypes/viewMarker"",""eventTypeId"":2,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenIssue"",""fn"":""return { markerId: event.properties.issueId, lat: event.properties.lat, lng: event.properties.lng, date: event.properties.createdOn, data: { type: 'citizen', description: event.properties.description, imageUrl: event.properties.imageUrl, state: event.properties.state, owner: event.properties.creator, createdOn: event.properties.createdOn, updatedOn: event.properties.updatedOn, issueTypeCode: event.properties.issueTypeCode }};"",""sampleEvent"":{""issueId"":""asdgdgqwrasd"",""imageUrl"":"""",""creator"":""Henri Dupont"",""description"":""Something went wrong"",""state"":""created"",""issueTypeCode"":""cdn"",""lat"":1.2345,""lng"":6.789,""createdOn"":""2015-05-12H12:34:56:000Z"",""updatedOn"":""2015-05-12H12:34:56:000Z""}},{""description"":""Update the visualization of the issue status change in Baulmes on MapBox."",""actionTargetId"":5,""actionTargetKey"":""RiZWXUxTIL9K"",""actionTypeId"":2,""actionType"":""http://localhost:3000/schemas/actionTypes/viewMarker"",""eventTypeId"":3,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenStatus"",""fn"":""return { markerId: event.properties.issueId, lat: event.properties.lat, lng: event.properties.lng, date: event.properties.createdOn, data: { type: 'citizen', description: event.properties.description, imageUrl: event.properties.imageUrl, state: event.properties.state, owner: event.properties.creator, createdOn: event.properties.createdOn, updatedOn: event.properties.updatedOn, issueTypeCode: event.properties.issueTypeCode }};"",""sampleEvent"":{""issueId"":""asdgdgqwrasd"",""imageUrl"":"""",""creator"":""Henri Dupont"",""description"":""Something went wrong"",""state"":""created"",""issueTypeCode"":""cdn"",""lat"":1.2345,""lng"":6.789,""createdOn"":""2015-05-12H12:34:56:000Z"",""updatedOn"":""2015-05-12H12:34:56:000Z""}},{""description"":""Update the global metric that account the actions for Baulmes issues."",""actionTargetId"":3,""actionTargetKey"":""juMV3NNTuxq3"",""actionTypeId"":3,""actionType"":""http://localhost:3000/schemas/actionTypes/updateMetric"",""eventTypeId"":4,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenAction"",""fn"":""return { metric: 'ch.heigvd.ptl.sc.ce.baulmes.actions.' + event.properties.type, timestamp: event.timestamp };"",""sampleEvent"":{""type"":""created""}},{""description"":""Update the global metric that account the issue creations for Baulmes issues."",""actionTargetId"":3,""actionTargetKey"":""juMV3NNTuxq3"",""actionTypeId"":3,""actionType"":""http://localhost:3000/schemas/actionTypes/updateMetric"",""eventTypeId"":2,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenIssue"",""fn"":""return { metric: 'ch.heigvd.ptl.sc.ce.baulmes.issues.creation', timestamp: event.timestamp };"",""sampleEvent"":{}}]",1,"2015-06-24 15:49:22.323000","2015-06-24 15:49:22.323000"
//4,"Citizen operations for Slack notifications","Broadcast Citizen Operations to Slack.",false,"[{""description"":""Detects issue creation."",""eventTypeId"":2,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenIssue""},{""description"":""Detects issue status changes."",""eventTypeId"":3,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenStatus""},{""description"":""Detects actions performed on issues."",""eventTypeId"":4,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenAction""}]","[{""description"":""Broadcast a creation message on Slack."",""actionTargetId"":1,""actionTargetKey"":""5a7n1DHbA5ZB"",""actionTypeId"":1,""actionType"":""http://localhost:3000/schemas/actionTypes/slackMessageSending"",""eventTypeId"":2,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenIssue"",""fn"":""return { channel: 'citizen', message: 'New issue created by ' + event.properties.creator + '. The problem is: ' + event.properties.description + ' and is situated at [' + event.properties.lat + ', ' + event.properties.lng + '].' };"",""sampleEvent"":{""issueId"":""asdgdgqwrasd"",""imageUrl"":"""",""creator"":""Henri Dupont"",""description"":""Something went wrong"",""state"":""created"",""issueTypeCode"":""cdn"",""lat"":1.2345,""lng"":6.789,""createdOn"":""2015-05-12H12:34:56:000Z"",""updatedOn"":""2015-05-12H12:34:56:000Z""}},{""description"":""Broadcast a status change message on Slack."",""actionTargetId"":1,""actionTargetKey"":""5a7n1DHbA5ZB"",""actionTypeId"":1,""actionType"":""http://localhost:3000/schemas/actionTypes/slackMessageSending"",""eventTypeId"":3,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenStatus"",""fn"":""return { channel: 'citizen', message: 'The issue created by ' + event.properties.creator + ' is now in state: ' + event.properties.state + '.' };"",""sampleEvent"":{""issueId"":""asdgdgqwrasd"",""imageUrl"":"""",""creator"":""Henri Dupont"",""description"":""Something went wrong"",""state"":""created"",""issueTypeCode"":""cdn"",""lat"":1.2345,""lng"":6.789,""createdOn"":""2015-05-12H12:34:56:000Z"",""updatedOn"":""2015-05-12H12:34:56:000Z""}},{""description"":""Broadcast a message on Slack for an action performed on issue."",""actionTargetId"":1,""actionTargetKey"":""5a7n1DHbA5ZB"",""actionTypeId"":1,""actionType"":""http://localhost:3000/schemas/actionTypes/slackMessageSending"",""eventTypeId"":4,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenAction"",""fn"":""return { channel: 'citizen', message: 'The action: ' + event.properties.type + ' has been done on issue: ' + event.properties.issue + ' by ' + event.properties.user + '.' };"",""sampleEvent"":{""type"":""comment"",""reason"":""Did something"",""user"":""Henri Dupont"",""issueId"":""asdgdgqwrasd"",""issue"":""Something went wrong"",""state"":""created"",""date"":""2015-05-12H12:34:56:000Z""}}]",1,"2015-06-24 15:49:22.217000","2015-06-30 16:59:27.110000"
//7,"Citizen operations for Payerne","Broadcast Citizen Operations for Payerne.",true,"[{""description"":""Detects issue creation."",""eventSourceId"":4,""eventSourceKey"":""E3XhnPifZKdS"",""eventTypeId"":2,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenIssue""},{""description"":""Detects issue status changes."",""eventSourceId"":4,""eventSourceKey"":""E3XhnPifZKdS"",""eventTypeId"":3,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenStatus""},{""description"":""Detects actions performed on issues."",""eventSourceId"":4,""eventSourceKey"":""E3XhnPifZKdS"",""eventTypeId"":4,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenAction""}]","[{""description"":""Update the visualization of the issue creation in Payerne on MapBox."",""actionTargetId"":6,""actionTargetKey"":""8tqCEqNza0ua"",""actionTypeId"":2,""actionType"":""http://localhost:3000/schemas/actionTypes/viewMarker"",""eventTypeId"":2,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenIssue"",""fn"":""return { markerId: event.properties.issueId, lat: event.properties.lat, lng: event.properties.lng, date: event.properties.createdOn, data: { type: 'citizen', description: event.properties.description, imageUrl: event.properties.imageUrl, state: event.properties.state, owner: event.properties.creator, createdOn: event.properties.createdOn, updatedOn: event.properties.updatedOn, issueTypeCode: event.properties.issueTypeCode }};"",""sampleEvent"":{""issueId"":""asdgdgqwrasd"",""imageUrl"":"""",""creator"":""Henri Dupont"",""description"":""Something went wrong"",""state"":""created"",""issueTypeCode"":""cdn"",""lat"":1.2345,""lng"":6.789,""createdOn"":""2015-05-12H12:34:56:000Z"",""updatedOn"":""2015-05-12H12:34:56:000Z""}},{""description"":""Update the visualization of the issue status change in Payerne on MapBox."",""actionTargetId"":6,""actionTargetKey"":""8tqCEqNza0ua"",""actionTypeId"":2,""actionType"":""http://localhost:3000/schemas/actionTypes/viewMarker"",""eventTypeId"":3,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenStatus"",""fn"":""return { markerId: event.properties.issueId, lat: event.properties.lat, lng: event.properties.lng, date: event.properties.createdOn, data: { type: 'citizen', description: event.properties.description, imageUrl: event.properties.imageUrl, state: event.properties.state, owner: event.properties.creator, createdOn: event.properties.createdOn, updatedOn: event.properties.updatedOn, issueTypeCode: event.properties.issueTypeCode }};"",""sampleEvent"":{""issueId"":""asdgdgqwrasd"",""imageUrl"":"""",""creator"":""Henri Dupont"",""description"":""Something went wrong"",""state"":""created"",""issueTypeCode"":""cdn"",""lat"":1.2345,""lng"":6.789,""createdOn"":""2015-05-12H12:34:56:000Z"",""updatedOn"":""2015-05-12H12:34:56:000Z""}},{""description"":""Update the global metric that account the actions for Payerne issues."",""actionTargetId"":3,""actionTargetKey"":""juMV3NNTuxq3"",""actionTypeId"":3,""actionType"":""http://localhost:3000/schemas/actionTypes/updateMetric"",""eventTypeId"":4,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenAction"",""fn"":""return { metric: 'ch.heigvd.ptl.sc.ce.payerne.actions.' + event.properties.type, timestamp: event.timestamp };"",""sampleEvent"":{""type"":""created""}},{""description"":""Update the global metric that account the issue creations for Payerne issues."",""actionTargetId"":3,""actionTargetKey"":""juMV3NNTuxq3"",""actionTypeId"":3,""actionType"":""http://localhost:3000/schemas/actionTypes/updateMetric"",""eventTypeId"":2,""eventType"":""http://localhost:3000/schemas/eventTypes/citizenIssue"",""fn"":""return { metric: 'ch.heigvd.ptl.sc.ce.payerne.issues.creation', timestamp: event.timestamp };"",""sampleEvent"":{}}]",1,"2015-06-24 15:49:22.382000","2015-06-24 15:49:22.382000"
//2,"Publibike movements notifications","Broadcast publibike movements notifications to Slack.",false,"[{""description"":""Detect bike movements"",""eventTypeId"":1,""eventType"":""http://localhost:3000/schemas/eventTypes/publibikeMovement""}]","[{""description"":""Broadcast a message on the Slack channel"",""actionTargetId"":1,""actionTargetKey"":""5a7n1DHbA5ZB"",""actionTypeId"":1,""actionType"":""http://localhost:3000/schemas/actionTypes/slackMessageSending"",""eventTypeId"":1,""eventType"":""http://localhost:3000/schemas/eventTypes/publibikeMovement"",""fn"":""return { channel: 'iflux', message: 'Only ' + event.properties.new.bikes + ' bike(s) available at the station ' + event.properties.terminal.name + ', ' + event.properties.terminal.street + ', ' + event.properties.terminal.zip + ' ' + event.properties.terminal.city + '.' };"",""sampleEvent"":{""terminalid"":""asdfghjkl"",""terminal"":{""name"":""Y-Parc"",""infotext"":""Parc Scientifique - Yverdon"",""zip"":""1400"",""city"":""Yverdon-les-Bains"",""country"":""Switzerland"",""lat"":46.764968,""lng"":6.646069,""image"":""""},""old"":{""freeholders"":10,""bikes"":3},""new"":{""freeholders"":11,""bikes"":2}}}]",1,"2015-06-24 15:49:22.114000","2015-06-30 16:59:26.982000"

exports.up = function(knex, Promise) {
	return Rule
		.fetchAll()
		.then(function(rules) {
			return Promise.all(_.reduce(rules.models, function(memo, rule) {
				var conditions = rule.get('conditions');

				_.each(conditions, function(condition) {
					if (condition.eventSourceId) {
						condition.eventSource = {
							id: condition.eventSourceId,
							generatedIdentifier: condition.eventSourceKey
						};

						delete condition.eventSourceId;
						delete condition.eventSourceKey;
					}

					if (condition.eventTypeId) {
						condition.eventType = {
							id: condition.eventTypeId,
							type: condition.eventType
						};

						delete condition.eventTypeId;
						delete condition.eventType;
					}
				});

				var transformations = rule.get('transformations');
				_.each(transformations, function(condition) {
					if (condition.actionTargetId) {
						condition.actionTarget = {
							id: condition.actionTargetId,
							generatedIdentifier: condition.actionTargetKey
						};

						delete condition.actionTargetId;
						delete condition.actionTargetKey;
					}

					if (condition.actionTypeId) {
						condition.actionType = {
							id: condition.actionTypeId,
							type: condition.actionType
						};

						delete condition.actionTypeId;
						delete condition.actionType;
					}

					if (condition.eventTypeId) {
						condition.eventType = {
							id: condition.eventTypeId,
							type: condition.eventType
						};

						delete condition.eventTypeId;
						delete condition.eventType;
					}
				});

				rule.set('conditions', conditions);
				rule.set('transformations', transformations);

				memo.push(rule.save());

				return memo;
			}, []));
		})
		.then(function() {
			console.log("done");
		})
	;
};

exports.down = function(knex, Promise) {
	return Rule
			.fetchAll()
			.then(function(rules) {
				return Promise.all(_.reduce(rules.models, function(rule, memo) {
					var conditions = rule.get('conditions');
					_.each(conditions, function(condition) {
						if (condition.eventSource) {
							condition.eventSourceId = condition.eventSource.id;
							condition.eventSourceKey = condition.eventSource.generatedIdentifier;
							delete condition.eventSource;
						}

						if (condition.eventType) {
							condition.eventTypeId = condition.eventType.id;
							condition.eventType = condition.eventType.type;
							delete condition.eventType;
						}
					});

					var transformations = rule.get('transformations');
					_.each(transformations, function(condition) {
						if (condition.actionTarget) {
							condition.actionTargetId = condition.actionTarget.id;
							condition.actionTargetKey = condition.actionTarget.generatedIdentifier;
							delete condition.actionTarget;
						}

						if (condition.actionType) {
							condition.actionTypeId = condition.actionType.id;
							condition.actionType = condition.actionType.type;
							delete condition.actionType;
						}

						if (condition.eventType) {
							condition.eventTypeId = condition.eventType.id;
							condition.eventType = condition.eventType.type;
							delete condition.eventType;
						}
					});

					rule.set('conditions', conditions);
					rule.set('transformations', transformations);

					memo.push(rule.save());

					return memo;
				}, []));
			})
	;
};
