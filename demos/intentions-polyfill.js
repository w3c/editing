// Author: Ben Peters, Microsoft Corporation
// All rights reserved
//
// This file works in IE9+, Chrome, and Firefox

(function(){
    // [[inputType, modifier_key, keycode, event, data], ...]
    var supportedIntentions = [];
    populateSupportedIntentions();
    
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
    
    function fireIntentionEvent (intentionDetails){
        var intentionEvent;
        var inputType = intentionDetails[0];
        var data = intentionDetails[4];
        var eventType = intentionDetails[3];
        switch (inputType)
        {
        default:
            intentionEvent = new CustomEvent(eventType, {"cancelable":true, "detail":{"inputType":inputType, "data": data}});
        }
        return document.activeElement.dispatchEvent(intentionEvent);
    }
    
    function performDefaultBehavior(intentionDetails, triggeringEvent) {
        var inputType = intentionDetails[0];
        switch (inputType) {
        case "replaceText":
            var targetStartContainer = document.getSelection().getRangeAt(0).startContainer;
            if (targetStartContainer != document.getSelection().getRangeAt(0).endContainer) {
                triggeringEvent.preventDefault(); // The selection crosses nodes, so typing has no default behavior
            }
            break;
        default:
            triggeringEvent.preventDefault(); //All other inputTypes have no default behavior, so prevent the browser's behavior
        }
    }
    
    //Post Page-Load Functionality
    window.addEventListener(
        'load',function (evt) {
            //intententionEvents Post-Load
                document.body.addEventListener(
                    "keydown",
                    function (evt)
                    {
                        for (var i = 0; i < supportedIntentions.length; i++)
                        {
                            if ((supportedIntentions[i][2] == evt.keyCode) &&
                                ((supportedIntentions[i][1] == "control") == evt.ctrlKey) &&
                                ((supportedIntentions[i][1] == "shift") == evt.shiftKey))
                            {
                                var cancelled = !fireIntentionEvent(supportedIntentions[i]);
                                if (cancelled)
                                {
                                    evt.preventDefault(); // Prevent browser default behavior for this Action event
                                } else {
                                    performDefaultBehavior(supportedIntentions[i], evt);
                                }
                                break;
                            }
                        }
                    });
                document.testIntention = 
                    function(intention)
                    {
                        for (var i = 0; i < supportedIntentions.length; i++)
                        {
                            if (supportedIntentions[i][0] == intention)
                            {
                                var cancelled = !fireIntentionEvent(supportedIntentions[i]);
                                if (cancelled)
                                {
                                    evt.preventDefault(); // Prevent browser default behavior for this Action event
                                } else {
                                    performDefaultBehavior(supportedIntentions[i]);
                                }
                                break;
                            }
                        } 
                    }
                var ceElement = document.querySelector('[contenteditable]');
                var ceAttribute = ceElement.getAttribute("contenteditable");
                if (ceAttribute.indexOf('typing') >= 0) 
                {
                    ceElement.setAttribute('contenteditable', 'true');
                }
        }
    );
    
    function populateSupportedIntentions()
    {
        supportedIntentions = 
           [["deleteContent", "none", 8, "beforeInput", "NULL"],
            ["insertNewline", "none", 13, "beforeInput", "NULL"],
            ["moveCaret", "none", 37, "beforeSelectionChange", "left"],
            ["moveCaret", "none", 38, "beforeSelectionChange", "up"],
            ["moveCaret", "none", 39, "beforeSelectionChange", "right"],
            ["moveCaret", "none", 40, "beforeSelectionChange", "down"],
            ["deleteContent", "none", 46, "beforeInput", "NULL"],
            ["replaceText", "none", 48, "beforeInput", "0"],
            ["replaceText", "none", 49, "beforeInput", "1"],
            ["replaceText", "none", 50, "beforeInput", "2"],
            ["replaceText", "none", 51, "beforeInput", "3"],
            ["replaceText", "none", 52, "beforeInput", "4"],
            ["replaceText", "none", 53, "beforeInput", "5"],
            ["replaceText", "none", 54, "beforeInput", "6"],
            ["replaceText", "none", 55, "beforeInput", "7"],
            ["replaceText", "none", 56, "beforeInput", "8"],
            ["replaceText", "none", 57, "beforeInput", "9"],
            ["replaceText", "none", 65, "beforeInput", "a"],
            ["replaceText", "none", 66, "beforeInput", "b"],
            ["replaceText", "none", 67, "beforeInput", "c"],
            ["replaceText", "none", 68, "beforeInput", "d"],
            ["replaceText", "none", 69, "beforeInput", "e"],
            ["replaceText", "none", 70, "beforeInput", "f"],
            ["replaceText", "none", 71, "beforeInput", "g"],
            ["replaceText", "none", 72, "beforeInput", "h"],
            ["replaceText", "none", 73, "beforeInput", "i"],
            ["replaceText", "none", 74, "beforeInput", "j"],
            ["replaceText", "none", 75, "beforeInput", "k"],
            ["replaceText", "none", 76, "beforeInput", "l"],
            ["replaceText", "none", 77, "beforeInput", "m"],
            ["replaceText", "none", 78, "beforeInput", "n"],
            ["replaceText", "none", 79, "beforeInput", "o"],
            ["replaceText", "none", 80, "beforeInput", "p"],
            ["replaceText", "none", 81, "beforeInput", "q"],
            ["replaceText", "none", 82, "beforeInput", "r"],
            ["replaceText", "none", 83, "beforeInput", "s"],
            ["replaceText", "none", 84, "beforeInput", "t"],
            ["replaceText", "none", 85, "beforeInput", "u"],
            ["replaceText", "none", 86, "beforeInput", "v"],
            ["replaceText", "none", 87, "beforeInput", "w"],
            ["replaceText", "none", 88, "beforeInput", "x"],
            ["replaceText", "none", 89, "beforeInput", "y"],
            ["replaceText", "none", 90, "beforeInput", "z"],
            ["replaceText", "none", 106, "beforeInput", "multiply"],
            ["replaceText", "none", 107, "beforeInput", "add"],
            ["replaceText", "none", 109, "beforeInput", "subtract"],
            ["replaceText", "none", 110, "beforeInput", "decimal point"],
            ["replaceText", "none", 111, "beforeInput", "divide"],
            ["replaceText", "none", 186, "beforeInput", ";"],
            ["replaceText", "none", 187, "beforeInput", "="],
            ["replaceText", "none", 188, "beforeInput", ","],
            ["replaceText", "none", 189, "beforeInput", "-"],
            ["replaceText", "none", 190, "beforeInput", "."],
            ["replaceText", "none", 219, "beforeInput", "["],
            ["replaceText", "none", 220, "beforeInput", "\\"],
            ["replaceText", "none", 221, "beforeInput", "]"],
            ["replaceText", "none", 222, "beforeInput", "'"],
            ["modify", "shift", 37, "beforeSelectionChange", ""],
            ["modify", "shift", 38, "beforeSelectionChange", ""],
            ["modify", "shift", 39, "beforeSelectionChange", ""],
            ["modify", "shift", 40, "beforeSelectionChange", ""],
            ["replaceText", "shift", 65, "beforeInput", "A"],
            ["replaceText", "shift", 66, "beforeInput", "B"],
            ["replaceText", "shift", 67, "beforeInput", "C"],
            ["replaceText", "shift", 68, "beforeInput", "D"],
            ["replaceText", "shift", 69, "beforeInput", "E"],
            ["replaceText", "shift", 70, "beforeInput", "F"],
            ["replaceText", "shift", 71, "beforeInput", "G"],
            ["replaceText", "shift", 72, "beforeInput", "H"],
            ["replaceText", "shift", 73, "beforeInput", "I"],
            ["replaceText", "shift", 74, "beforeInput", "J"],
            ["replaceText", "shift", 75, "beforeInput", "K"],
            ["replaceText", "shift", 76, "beforeInput", "L"],
            ["replaceText", "shift", 77, "beforeInput", "M"],
            ["replaceText", "shift", 78, "beforeInput", "N"],
            ["replaceText", "shift", 79, "beforeInput", "O"],
            ["replaceText", "shift", 80, "beforeInput", "P"],
            ["replaceText", "shift", 81, "beforeInput", "Q"],
            ["replaceText", "shift", 82, "beforeInput", "R"],
            ["replaceText", "shift", 83, "beforeInput", "S"],
            ["replaceText", "shift", 84, "beforeInput", "T"],
            ["replaceText", "shift", 85, "beforeInput", "U"],
            ["replaceText", "shift", 86, "beforeInput", "V"],
            ["replaceText", "shift", 87, "beforeInput", "W"],
            ["replaceText", "shift", 88, "beforeInput", "X"],
            ["replaceText", "shift", 89, "beforeInput", "Y"],
            ["replaceText", "shift", 90, "beforeInput", "Z"],
            ["selectall", "control", 65, "beforeSelectionChange", "NULL"], 
            ["formatContent", "control", 66, "beforeInput", "bold:toggle"], 
            ["copy", "control", 67, "clipboard", "N/A"], 
            ["formatContent", "control", 73, "beforeInput", "italic:toggle"], 
            ["formatContent", "control", 85, "beforeInput", "underline:toggle"], 
            ["paste", "control", 86, "clipboard", "N/A"], 
            ["cut", "control", 88, "clipboard", "N/A"],
            ["redo", "control", 89, "beforeInput", "NULL"], 
            ["undo", "control", 90, "beforeInput", "NULL"]];    
            
        supportedIntentions.getIntentionDetails = 
            function(name)
            {
                for (var i = 0; i < supportedIntentions.length; i++)
                {
                    if (supportedIntentions[i][0] == name)
                    {
                        return supportedIntentions[i];
                    }
                }
                return null;
            };
    }
})();