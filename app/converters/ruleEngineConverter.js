module.exports = {
	convertEventType: function(eventTypeModel) {
		if (eventTypeModel) {
			return {
				generatedIdentifier: eventTypeModel.get('generatedIdentifier'),
				name: eventTypeModel.get('name'),
				description: eventTypeModel.get('description'),
				public: eventTypeModel.get('public'),
				type: eventTypeModel.get('type')
			};
		}
		else {
			return null;
		}
	},

	convertActionType: function(actionTypeModel) {
		if (actionTypeModel) {
			return {
				generatedIdentifier: actionTypeModel.get('generatedIdentifier'),
				name: actionTypeModel.get('name'),
				description: actionTypeModel.get('description'),
				public: actionTypeModel.get('public'),
				type: actionTypeModel.get('type')
			};
		}
		else {
			return null;
		}
	},

	convertEventSource: function(eventSourceModel) {
		if (eventSourceModel) {
			return {
				generatedIdentifier: eventSourceModel.get('generatedIdentifier'),
				name: eventSourceModel.get('name')
			};
		}
		else {
			return null;
		}
	},

	convertActionTarget: function(actionTargetModel) {
		if (actionTargetModel) {
			return {
				generatedIdentifier: actionTargetModel.get('generatedIdentifier'),
				name: actionTargetModel.get('name')
			};
		}
		else {
			return null;
		}
	}
};