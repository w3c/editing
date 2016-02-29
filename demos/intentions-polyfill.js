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
           [["deleteContent", "none", 8, "beforeinput", "NULL"],
            ["insertNewline", "none", 13, "beforeinput", "NULL"],
            ["moveCaret", "none", 37, "beforeSelectionChange", "left"],
            ["moveCaret", "none", 38, "beforeSelectionChange", "up"],
            ["moveCaret", "none", 39, "beforeSelectionChange", "right"],
            ["moveCaret", "none", 40, "beforeSelectionChange", "down"],
            ["deleteContent", "none", 46, "beforeinput", "NULL"],
            ["replaceText", "none", 48, "beforeinput", "0"],
            ["replaceText", "none", 49, "beforeinput", "1"],
            ["replaceText", "none", 50, "beforeinput", "2"],
            ["replaceText", "none", 51, "beforeinput", "3"],
            ["replaceText", "none", 52, "beforeinput", "4"],
            ["replaceText", "none", 53, "beforeinput", "5"],
            ["replaceText", "none", 54, "beforeinput", "6"],
            ["replaceText", "none", 55, "beforeinput", "7"],
            ["replaceText", "none", 56, "beforeinput", "8"],
            ["replaceText", "none", 57, "beforeinput", "9"],
            ["replaceText", "none", 65, "beforeinput", "a"],
            ["replaceText", "none", 66, "beforeinput", "b"],
            ["replaceText", "none", 67, "beforeinput", "c"],
            ["replaceText", "none", 68, "beforeinput", "d"],
            ["replaceText", "none", 69, "beforeinput", "e"],
            ["replaceText", "none", 70, "beforeinput", "f"],
            ["replaceText", "none", 71, "beforeinput", "g"],
            ["replaceText", "none", 72, "beforeinput", "h"],
            ["replaceText", "none", 73, "beforeinput", "i"],
            ["replaceText", "none", 74, "beforeinput", "j"],
            ["replaceText", "none", 75, "beforeinput", "k"],
            ["replaceText", "none", 76, "beforeinput", "l"],
            ["replaceText", "none", 77, "beforeinput", "m"],
            ["replaceText", "none", 78, "beforeinput", "n"],
            ["replaceText", "none", 79, "beforeinput", "o"],
            ["replaceText", "none", 80, "beforeinput", "p"],
            ["replaceText", "none", 81, "beforeinput", "q"],
            ["replaceText", "none", 82, "beforeinput", "r"],
            ["replaceText", "none", 83, "beforeinput", "s"],
            ["replaceText", "none", 84, "beforeinput", "t"],
            ["replaceText", "none", 85, "beforeinput", "u"],
            ["replaceText", "none", 86, "beforeinput", "v"],
            ["replaceText", "none", 87, "beforeinput", "w"],
            ["replaceText", "none", 88, "beforeinput", "x"],
            ["replaceText", "none", 89, "beforeinput", "y"],
            ["replaceText", "none", 90, "beforeinput", "z"],
            ["replaceText", "none", 106, "beforeinput", "multiply"],
            ["replaceText", "none", 107, "beforeinput", "add"],
            ["replaceText", "none", 109, "beforeinput", "subtract"],
            ["replaceText", "none", 110, "beforeinput", "decimal point"],
            ["replaceText", "none", 111, "beforeinput", "divide"],
            ["replaceText", "none", 186, "beforeinput", ";"],
            ["replaceText", "none", 187, "beforeinput", "="],
            ["replaceText", "none", 188, "beforeinput", ","],
            ["replaceText", "none", 189, "beforeinput", "-"],
            ["replaceText", "none", 190, "beforeinput", "."],
            ["replaceText", "none", 219, "beforeinput", "["],
            ["replaceText", "none", 220, "beforeinput", "\\"],
            ["replaceText", "none", 221, "beforeinput", "]"],
            ["replaceText", "none", 222, "beforeinput", "'"],
            ["modify", "shift", 37, "beforeSelectionChange", ""],
            ["modify", "shift", 38, "beforeSelectionChange", ""],
            ["modify", "shift", 39, "beforeSelectionChange", ""],
            ["modify", "shift", 40, "beforeSelectionChange", ""],
            ["replaceText", "shift", 65, "beforeinput", "A"],
            ["replaceText", "shift", 66, "beforeinput", "B"],
            ["replaceText", "shift", 67, "beforeinput", "C"],
            ["replaceText", "shift", 68, "beforeinput", "D"],
            ["replaceText", "shift", 69, "beforeinput", "E"],
            ["replaceText", "shift", 70, "beforeinput", "F"],
            ["replaceText", "shift", 71, "beforeinput", "G"],
            ["replaceText", "shift", 72, "beforeinput", "H"],
            ["replaceText", "shift", 73, "beforeinput", "I"],
            ["replaceText", "shift", 74, "beforeinput", "J"],
            ["replaceText", "shift", 75, "beforeinput", "K"],
            ["replaceText", "shift", 76, "beforeinput", "L"],
            ["replaceText", "shift", 77, "beforeinput", "M"],
            ["replaceText", "shift", 78, "beforeinput", "N"],
            ["replaceText", "shift", 79, "beforeinput", "O"],
            ["replaceText", "shift", 80, "beforeinput", "P"],
            ["replaceText", "shift", 81, "beforeinput", "Q"],
            ["replaceText", "shift", 82, "beforeinput", "R"],
            ["replaceText", "shift", 83, "beforeinput", "S"],
            ["replaceText", "shift", 84, "beforeinput", "T"],
            ["replaceText", "shift", 85, "beforeinput", "U"],
            ["replaceText", "shift", 86, "beforeinput", "V"],
            ["replaceText", "shift", 87, "beforeinput", "W"],
            ["replaceText", "shift", 88, "beforeinput", "X"],
            ["replaceText", "shift", 89, "beforeinput", "Y"],
            ["replaceText", "shift", 90, "beforeinput", "Z"],
            ["selectall", "control", 65, "beforeSelectionChange", "NULL"],
            ["formatContent", "control", 66, "beforeinput", "bold:toggle"],
            ["copy", "control", 67, "clipboard", "N/A"],
            ["formatContent", "control", 73, "beforeinput", "italic:toggle"],
            ["formatContent", "control", 85, "beforeinput", "underline:toggle"], 
            ["paste", "control", 86, "clipboard", "N/A"],
            ["cut", "control", 88, "clipboard", "N/A"],
            ["redo", "control", 89, "beforeinput", "NULL"],
            ["undo", "control", 90, "beforeinput", "NULL"]];

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
