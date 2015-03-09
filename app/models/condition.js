var
	mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var conditionSchema = new Schema({
	source: String,
	type: String,
	properties: Schema.Types.Mixed
});

mongoose.model('Condition', conditionSchema);
