// Author: Ben Peters, Microsoft Corporation
// All rights reserved
//
// This file works in IE9+, Chrome, and Firefox

(function(){
	var IntentionEventsEnabled = false;
	// [Intention, modifier_key, keycode, event]
	var uaSupportedIntentionNames = [];
    populateUaSupportedIntentionNames();
	
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
                var ceElement = document.querySelector('[contenteditable]');
                var ceAttribute = ceElement.getAttribute("contenteditable");
                if (ceAttribute.indexOf('typing') >= 0) 
                {
                    ceElement.setAttribute('contenteditable', 'true');
                    ceElement.addEventListener("beforeInput", 
                        function (evt) 
                        {
                            if (evt.intention != "insertText")
                            {
                                evt.preventDefault();
                            }
                        });
                }
                else if (ceAttribute.indexOf('selection') >= 0)
                {
                    ceElement.setAttribute('contenteditable', 'true');
                    ceElement.addEventListener("beforeInput", function (evt) {evt.preventDefault()});
                }
                else if (ceAttribute.indexOf('cursor') >= 0)
                {
                    ceElement.setAttribute('contenteditable', 'true');
                    ceElement.addEventListener("beforeSelectionChange", function (evt) {evt.preventDefault()});
                    ceElement.addEventListener("beforeInput", function (evt) {evt.preventDefault()});
                }
			}
		}
	);
    
    function populateUaSupportedIntentionNames()
    {
        uaSupportedIntentionNames = 
           [["delete", "none", 8, "beforeInput"],
            ["newline", "none", 13, "beforeInput"],
            ["moveCaret", "none", 37, "beforeSelectionChange"],
            ["moveCaret", "none", 38, "beforeSelectionChange"],
            ["moveCaret", "none", 39, "beforeSelectionChange"],
            ["moveCaret", "none", 40, "beforeSelectionChange"],
            ["delete", "none", 46, "beforeInput"],
            ["insertText", "none", 48, "beforeInput"],
            ["insertText", "none", 49, "beforeInput"],
            ["insertText", "none", 50, "beforeInput"],
            ["insertText", "none", 51, "beforeInput"],
            ["insertText", "none", 52, "beforeInput"],
            ["insertText", "none", 53, "beforeInput"],
            ["insertText", "none", 54, "beforeInput"],
            ["insertText", "none", 55, "beforeInput"],
            ["insertText", "none", 56, "beforeInput"],
            ["insertText", "none", 57, "beforeInput"],
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
            ["insertText", "none", 90, "beforeInput"],
            ["insertText", "none", 96, "beforeInput"],
            ["insertText", "none", 97, "beforeInput"],
            ["insertText", "none", 98, "beforeInput"],
            ["insertText", "none", 99, "beforeInput"],
            ["insertText", "none", 100, "beforeInput"],
            ["insertText", "none", 101, "beforeInput"],
            ["insertText", "none", 102, "beforeInput"],
            ["insertText", "none", 103, "beforeInput"],
            ["insertText", "none", 104, "beforeInput"],
            ["insertText", "none", 105, "beforeInput"],
            ["insertText", "none", 107, "beforeInput"],
            ["insertText", "none", 109, "beforeInput"],
            ["insertText", "none", 110, "beforeInput"],
            ["insertText", "none", 111, "beforeInput"],
            ["insertText", "none", 186, "beforeInput"],
            ["insertText", "none", 187, "beforeInput"],
            ["insertText", "none", 188, "beforeInput"],
            ["insertText", "none", 189, "beforeInput"],
            ["insertText", "none", 190, "beforeInput"],
            ["insertText", "none", 219, "beforeInput"],
            ["insertText", "none", 220, "beforeInput"],
            ["insertText", "none", 221, "beforeInput"],
            ["insertText", "none", 222, "beforeInput"],
            ["modify", "shift", 37, "beforeSelectionChange"],
            ["modify", "shift", 38, "beforeSelectionChange"],
            ["modify", "shift", 39, "beforeSelectionChange"],
            ["modify", "shift", 40, "beforeSelectionChange"],
            ["insertText", "shift", 65, "beforeInput"],
            ["insertText", "shift", 66, "beforeInput"],
            ["insertText", "shift", 67, "beforeInput"],
            ["insertText", "shift", 68, "beforeInput"],
            ["insertText", "shift", 69, "beforeInput"],
            ["insertText", "shift", 70, "beforeInput"],
            ["insertText", "shift", 71, "beforeInput"],
            ["insertText", "shift", 72, "beforeInput"],
            ["insertText", "shift", 73, "beforeInput"],
            ["insertText", "shift", 74, "beforeInput"],
            ["insertText", "shift", 75, "beforeInput"],
            ["insertText", "shift", 76, "beforeInput"],
            ["insertText", "shift", 77, "beforeInput"],
            ["insertText", "shift", 78, "beforeInput"],
            ["insertText", "shift", 79, "beforeInput"],
            ["insertText", "shift", 80, "beforeInput"],
            ["insertText", "shift", 81, "beforeInput"],
            ["insertText", "shift", 82, "beforeInput"],
            ["insertText", "shift", 83, "beforeInput"],
            ["insertText", "shift", 84, "beforeInput"],
            ["insertText", "shift", 85, "beforeInput"],
            ["insertText", "shift", 86, "beforeInput"],
            ["insertText", "shift", 87, "beforeInput"],
            ["insertText", "shift", 88, "beforeInput"],
            ["insertText", "shift", 89, "beforeInput"],
            ["selectall", "control", 65, "beforeSelectionChange"], 
            ["format", "control", 66, "beforeInput"], 
            ["copy", "control", 67, "beforeInput"], 
            ["format", "control", 73, "beforeInput"], 
            ["format", "control", 85, "beforeInput"], 
            ["paste", "control", 86, "beforeInput"], 
            ["cut", "control", 88, "beforeInput"],
            ["redo", "control", 89, "beforeInput"], 
            ["undo", "control", 90, "beforeInput"]];	
            
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
    }
})();