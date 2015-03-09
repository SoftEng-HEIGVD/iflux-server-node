var
	Handlebars = require('handlebars'),
	mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var actionSchema = new Schema({
	target: String,
	actionSchema: String
});

mongoose.model('Action', actionSchema);

actionSchema.methods.evaluate = generate = function(event) {
	var transformation = Handlebars.compile(this.actionSchema);

	var action = transformation(event);

	var actionObject = JSON.parse(action);
  return {
    target : this.target,
    payload : actionObject
  };
};

