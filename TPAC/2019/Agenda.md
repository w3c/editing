# 2019 Agenda

Date: September 20th, 2019

Timing:
- 8:30 - 9:15 EditContext
- 9:15 - 09:20 Break (5 mins)
- 9:20 - 10:05 EditContext
- 10:05 -10:20 Break (15 mins)
- 10:20 -11:05 EditContext/contenteditable-disabled
- 11:05- 11:10 Break (5 mins)
- 11:10 - 11:55 contenteditable-disabled/HighlightAPI
- 11:55 - 13:00 Lunch
- 13:00 - 13:45 HighlightAPI
- 13:45 - 13:50 Break (5 mins)
- 13:50 - 14:35 HighlightAPI
- 14:35 - 14:50 Break (15 mins)
- 14:50 - 15:50 Undo Manager/Spellcheck API
- 15:50 - 16:35 Clipboard
- 16:25 - 16:40 Break (15 mins)
- 16:40 -  17:25 Clipboard
- 17:25 - 17:40 Break  (15 mins)
- 17:40 - 18:30 Clipboard

## Topics:
- [EditContext API](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/master/EditContext/explainer.md) (2 hours)

    Objectives:

- [Highlight API](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/master/highlight/explainer.md) (2 hours)

    Objectives:
    1. todo: provide links to the issues.
    1. Static Ranges [applicability](https://github.com/whatwg/dom/issues/590)
    1. Range in native elements
    1. Range events
    1. Is the proposal in a good enough shape to be moved into a spec draft phase? If so, is CSSWG a good place for it to live in?

- [Remaining gaps in async clipboard API](https://bugs.chromium.org/p/chromium/issues/detail?id=931839) (2 hours)

    Objectives:

    We are thinking of picking up the work where Chrome's team left of. Specifically, building support for html mime type and implementing clipboardChange event.

- [Raw Clipboard Access](https://tinyurl.com/raw-clipboard-access-design) - (1 hour) Discuss the API with other browser vendors and interested developers.

    Objectives:

- [contenteditable-disabled](http://w3c.github.io/editing/docs/contentEditableDisabled/) (1 hour)

    Objectives:

- Spellcheck APIs (30minutes)- inspired by https://github.com/w3c/editing/issues/166.

    Objectives:
    wanted to gauge the interest from editing frameworks and other js developers.
    wanted to walk though use cases and hopefully, agree on the shape of the API if time allows.

- [SIP policy](https://github.com/whatwg/html/issues/4876) (30 mins)- we've received a request from Excel online and Google Docs asking for a way to control SIP. Excel's use case is to prevent SIP from showing up when editable element is focused. Google Docs has mentioned to have an explicit API for the virtual keyboard on touchscreen devices, particularly for showing/hiding the keyboard and querying its current state.. This is needed in cases where users would want to maintain editability of an element without invoking the SIP. We wanted to gauge interest in the community for this API

    Objectives:

 - [Undo Manager](https://whsieh.github.io/UndoManager/) (30 mins)- Give JavaScript a way to manipulate the browser's undo stack.

   Objectives:

   [Spec Draft](https://rniwa.github.io/undo-api/)
