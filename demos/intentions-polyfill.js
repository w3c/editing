// Author: Ben Peters, Microsoft Corporation
// All rights reserved
//
// This file works in IE9+, Chrome, and Firefox

(function(){
	var IntentionEventsEnabled = false;
	// [Intention, modifier_key, keycode, event]
	var uaSupportedIntentionNames = 
	   [["selectall", "control", 65, "beforeSelectionChange"], 
		["format", "control", 66, "beforeInput"], 
		["format", "control", 73, "beforeInput"], 
		["format", "control", 85, "beforeInput"], 
		["undo", "control", 90, "beforeInput"], 
		["redo", "control", 89, "beforeInput"],
		["selectRight", "shift", 39, "beforeSelectionChange"],
		["insertText", "none", 65, "beforeInput"],
		["insertText", "none", 66, "beforeInput"],
		["insertText", "none", 67, "beforeInput"],
		["insertText", "none", 68, "beforeInput"],
		["insertText", "none", 69, "beforeInput"],
		["insertText", "none", 70, "beforeInput"],
		["insertText", "none", 71, "beforeInput"],
		["insertText", "none", 72, "beforeInput"],
		["insertText", "none", 73, "beforeInput"],
		["insertText", "none", 74, "beforeInput"],
		["insertText", "none", 75, "beforeInput"],
		["insertText", "none", 76, "beforeInput"],
		["insertText", "none", 77, "beforeInput"],
		["insertText", "none", 78, "beforeInput"],
		["insertText", "none", 79, "beforeInput"],
		["insertText", "none", 80, "beforeInput"],
		["insertText", "none", 81, "beforeInput"],
		["insertText", "none", 82, "beforeInput"],
		["insertText", "none", 83, "beforeInput"],
		["insertText", "none", 84, "beforeInput"],
		["insertText", "none", 85, "beforeInput"],
		["insertText", "none", 86, "beforeInput"],
		["insertText", "none", 87, "beforeInput"],
		["insertText", "none", 88, "beforeInput"],
		["insertText", "none", 89, "beforeInput"],
		["insertText", "none", 90, "beforeInput"]];	
	uaSupportedIntentionNames.getIntentionDetails = 
		function(name)
		{
			for (var i = 0; i < uaSupportedIntentionNames.length; i++)
			{
				if (uaSupportedIntentionNames[i][0] == name)
				{
					return uaSupportedIntentionNames[i];
				}
			}
			return null;
		};
	
	(function () {
		function CustomEvent ( event, params ) {
	    	params = params || { bubbles: false, cancelable: false, detail: undefined };
		    var evt = document.createEvent( 'CustomEvent' );
		    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
		    return evt;
	    };
		if (window.CustomEvent) {
			CustomEvent.prototype = window.CustomEvent.prototype;
		}
     	window.CustomEvent = CustomEvent;
	})();
	
	//intententionEvents
	if (document){
		IntentionEventsEnabled = true;
		document.declareIntention = 
			function (name, arg){
				console.info('declareIntention');
				var intentionDetails = uaSupportedIntentionNames.getIntentionDetails(name);
				var intentionEvent;
				if (null != intentionDetails)
				{
					eventType = intentionDetails[3];
					switch (eventType)
					{
					default:
						intentionEvent = new CustomEvent(eventType, {"cancelable":true, "detail":{"intention":name}});
					}
				}
				return document.activeElement.dispatchEvent(intentionEvent);
			};
	}
	
	if (Object.defineProperty && CustomEvent && CustomEvent.prototype) {
		Object.defineProperty(CustomEvent.prototype, "intention",	
			{ enumerable: true, configurable: true, 
				get: function() {
					var result = null; 
					if (this.detail.intention) { 
						result = this.detail.intention; 
					} 
					return result; 
				} 
			});
	}
	
	//Post Page-Load Functionality
	window.addEventListener(
		'load',function (evt) {
			//intententionEvents Post-Load
			if (IntentionEventsEnabled){
				document.body.addEventListener(
					"keydown",
					function (evt)
					{
						for (var i = 0; i < uaSupportedIntentionNames.length; i++)
						{
							if ((uaSupportedIntentionNames[i][2] == evt.keyCode) &&
								((uaSupportedIntentionNames[i][1] == "control") == evt.ctrlKey) &&
								((uaSupportedIntentionNames[i][1] == "shift") == evt.shiftKey))
							{
								var cancelled = !document.declareIntention(uaSupportedIntentionNames[i][0]);
								if (cancelled)
								{
									evt.preventDefault();
								}
								break;
							}
						}							
					});
			}
		}
	);
})();