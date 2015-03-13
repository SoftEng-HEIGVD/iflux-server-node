var
	Handlebars = require('handlebars'),
	mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var actionSchema = new Schema({
	target: String,
	actionSchema: String
});

actionSchema.methods.createConcreteAction = function(event) {
	try {
		var transformation = Handlebars.compile(this.actionSchema);

		var action = transformation(event);

		var actionObject = JSON.parse(action);

		return {
			target: this.target,
			payload: actionObject
		};
	}
	catch (err) {
		console.log(err);
		return null;
	}
};

mongoose.model('Action', actionSchema);
