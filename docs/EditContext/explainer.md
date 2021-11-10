# EditContext API Explainer
## Introduction
The EditContext is a new API that simplifies the process of integrating a web app with [advanced text input methods](#example-text-input-methods), improves accessibility and performance, and unlocks new capabilities for web-based editors.

## Motivation
The web platform provides out-of-the-box editing experiences for single lines of plain-text (input), small amounts of multi-line plain-text (textarea) and a starting point for building an HTML document editing experience (contenteditable elements).

Each of the editable elements provided by the web platform comes with built-in editing behaviors that are often inadequate to power the desired editing experience. As a result, web-based editors don't incorporate the web platform's editable elements into their view. Unfortunately, the only API provided by the web platform today to enable [advanced text input](#example-text-input-methods) experiences is to place an editable element in the DOM and focus it.

This contradiction of needing an editable element, but not wanting it to be visible, leads web-based editors to create hidden editable elements to facilitate text input.  This approach negatively impacts accessibility and increases complexity, leading to buggy behavior.

An alternative is to incorporate a contenteditable element into the view of the editor, regardless of whether the editor is editing an HTML document.  This approach limits the editor's flexibilty in modifying the view, since the view is also powering the text input experience.

## Real-world Examples of Text Input Issues in Top Sites and Frameworks
### Accessibility Issues in the Monaco Editor
[This video](https://www.youtube.com/watch?v=xzC86EG9lPo) demos Windows Narrator reading from a hidden textarea element in the Monaco editor and compares it with the intended experience by showing Narrator reading text from CKEditor, which uses a contenteditable element as part of its view.

Monaco edits plain text - it's a code editor. The plain text document is presented using a rich view created from HTML, but a hidden textarea is used to integrate with the text input services of the OS.  This approach makes the hidden textarea the accessibile surface for the editable content being edited.

Two aspects of accessibility suffer as a result:
  1. The focused element is off screen so narrator doesn't place a blue outline around the words as they are read aloud.
  2. Unless Monaco duplicates the whole document into the textarea element, only a fraction of the content can be read before Narrator moves prematurely out of the document content and starts reading elsewhere on the page.

### Trouble Collaborating in Word Online while Composing Text
[This video](https://www.youtube.com/watch?v=s7Ga2VYFiGo) shows a collaboration feature in Word Online where two users can see each other's edits and caret positions. Collaboration is suspended though while composition is in progress. When composition is active, updates to the view (especially nearby the composition) may cancel the composition and prevent text input.

To work around this problem, Word Online waits until the composition finishes before updating the view. Some Chinese IMEs don't auto commit their composition; it just keeps going until the user types Enter. As a result, collaboration may be blocked for some time.

### Can't Use the Windows Emoji Picker in Google Docs
[In this video](https://www.youtube.com/watch?v=iVclyPE55Js) Google Docs is using an off screen contenteditable element to enable text input.  This approach gives Google Docs access to text input features like an IME for composition, as well as enabling the emoji picker and other [advanced text input](#example-text-input-methods) options.

Google Docs is listening for events to ensure the contenteditable element is focused and positioned appropriately near the insertion point before composition starts.  It isn't aware of all events, or in some cases doesn't receive any events, when other text input UI like the emoji picker is displayed.  As a result, the emoji window is positioned near the top of the app (not near the insertion point) and input isn't received since focus isn't currently in an editable element.

### Trouble Composing Across Page Boundaries
[In this video](https://www.youtube.com/watch?v=iXgttLgJY_I) Native Word on Windows is shown updating its view while in an active composition. The scenario demonstrated requires Word to relocate the active composition into a different page based on layout constraints.

Because the web platform integrates with the OS text input services through its HTML DOM view, updating the view while composition is in progress may cancel the composition and prevent text input.  Using the EditContext, however, the view can be updated and new locations for where composition is occurring can be reported without canceling the composition.

### No Support for Type-to-search in Custom Controls with Chinese Characters
[This video](https://www.youtube.com/watch?v=rHEPdi1Rw34) demonstrates an IE feature that automatically selected an option in a select element based on the text typed by the user - even when that text is being composed.

Custom components have no ability to achieve similar behavior, but with the EditContext API type-to-search can be a reality for arbitrary custom elements.  Non-editing scenarios will also benefit from the EditContext.

## Proposal: EditContext API
The EditContext addresses the problems above by decoupling text input from the HTML DOM view.  Rather than having the web platform infer the data required to enable sophisticated text input mechanisms from the HTML DOM, the author will provide that data explicitly through the API surface of the EditContext.

Specifically, the EditContext allows the author to provide:
  * The coordinates of the selection and of a logically editable element so that UI relating to text input can be appropriately positioned.
  * Contextual text nearby the selection enabling suggestions for input methods that support generating them.
  * The location (expressed as offsets into the contextual text) of selection to enable text input to be inserted at the right location.
  * The inputMode to specialize software keyboard layouts.
  * The EnterKeyHint to specialize the display of the Enter key on software keyboards.
  * The inputPolicy to control whether a software keyboard should automatically appear or needs to be requested explicitly by the user.
  * More than one EditContext to convey the information listed above for multiple editable regions of a web application.
  * An ability to specify which of those multiple EditContexts is currently the target of text input.

Additionally, the EditContext communicates events driven from text input UI to JavaScript:
  * Text and selection update events; these represent requests for the web app to update their text and selection model given some text input from the user.
  * Composition start and end events.
  * Text formatting requests that indicate where activity relating to text input, e.g. composition, is taking place.

### EditContext Event Sequence:

This section describes the sequences of events that get fired on the EditContext and the focused element when IME is active. In this example, the user types 's' and 'u' in Japanese, then commits the first candidate '巣' by hitting 'Space'.

|  Event                | EventTarget        |  key code            | event.updateText
| -------------         | -----------------  | -------------------  | -------------------
|  keydown              | focused element    |  'S'                 |
|  compositionstart     | active EditContext |                      |
|  textupdate           | active EditContext |                      |  'S'
|  textformatupdate     | active EditContext |                      |
|  keyup                | focused element    |  'S'                 |
|  keydown              | focused element    |  'U'                 |
|  textupdate           | active EditContext |                      |  'す'
|  textformatupdate     | active EditContext |                      |
|  keyup                | focused element    |  'U'                 |
|  keydown              | focused element    |  'Space'             |
|  textupdate           | active EditContext |                      |  '巣'
|  textformatupdate     | active EditContext |                      |
|  compositionend       | active EditContext |                      |
|  keyup                | focused element    |  'Space'             |

### EditContext WebIDL
```webidl

dictionary TextUpdateEventInit {
    unsigned long updateRangeStart;
    unsigned long updateRangeEnd;
    DOMString updateText;
    unsigned long newSelectionStart;
    unsigned long newSelectionEnd;
};

[Exposed=Window]
interface TextUpdateEvent : Event {
    constructor(optional TextUpdateEventInit options = {});
    readonly attribute unsigned long updateRangeStart;
    readonly attribute unsigned long updateRangeEnd;
    readonly attribute DOMString updateText;
    readonly attribute unsigned long newSelectionStart;
    readonly attribute unsigned long newSelectionEnd;
};

dictionary TextFormatUpdateEventInit {
    unsigned long formatRangeStart;
    unsigned long formatRangeEnd;
    DOMString underlineColor;
    DOMString backgroundColor;
    DOMString suggestionHighlightColor;
    DOMString textColor;
    DOMString underlineThickness;
    DOMString underlineStyle;
};

[Exposed=Window]
interface TextFormatUpdateEvent : Event {
    constructor(optional TextFormatUpdateEventInit options = {});
    readonly attribute unsigned long formatRangeStart;
    readonly attribute unsigned long formatRangeEnd;
    readonly attribute DOMString underlineColor;
    readonly attribute DOMString backgroundColor;
    readonly attribute DOMString suggestionHighlightColor;
    readonly attribute DOMString textColor;
    readonly attribute DOMString underlineThickness;
    readonly attribute DOMString underlineStyle;
};

dictionary EditContextInit {
    DOMString text;
    unsigned long selectionStart;
    unsigned long selectionEnd;
};

/// @event name="textupdate", type="TextUpdateEvent"
/// @event name="textformatupdate", type="TextFormatUpdateEvent"
/// @event name="compositionstart", type="CompositionEvent"
/// @event name="compositionend", type="CompositionEvent"
[Exposed=Window]
interface EditContext : EventTarget {
    constructor(optional EditContextInit options = {});

    void updateSelection(unsigned long start, unsigned long end);
    void updateBounds(DOMRect controlBounds, DOMRect selectionBounds);
    void updateText(unsigned long start, unsigned long end, DOMString newText);

    attribute DOMString text;
    attribute unsigned long selectionStart;
    attribute unsigned long selectionEnd;

    // Event handler attributes
    attribute EventHandler ontextupdate;
    attribute EventHandler ontextformatupdate;
    attribute EventHandler oncompositionstart;
    attribute EventHandler oncompositionend;
};
```
## Difference between Contenteditable element and the EditContext element.

![contenteditable_vs_editcontext](contentEditable_vs_editContext.png)

One can think of a div with Contenteditable (on the left in the above figure) as a div with a built-in EditContext which maintains a plain text buffer that serves as a plain text view (or IME-facing view) to communicate with various text input services (ex. IME, handwriting recognition, speech detection, etc.) When users initiate text inputs, the text input services will update the plain text buffer through the plain text view. The built-in EditContext then sends internal events to the div which takes the plain text buffer as part of its own model and updates the DOM, which serves as a user-facing view, based on some default editing behaviors defined by the brower.

When a div is associated with an EditContext (on the right in the above figure), the "external" EditContext takes over the text input. Instead of directly triggering the default manipulation of the DOM, the text input now updates the plain text buffer in the external EditContext. The external EditContext then sends events to JavaScript and web-based editors can listen to the events, updates their own models, and manipulates the DOM per their desired editing experiences.

Note that EditContext only decouples and handles the manipulation of the plain text view coming from the text input services. Manipulation involving the user-facing view (ex. drag and drop selected text, spell check replacement, up/down arrow keys to move the caret between lines), or manipulation involving formats (ex. ctrl+B, outdent/indent) are out of scope of EditContext, however, the beforeinput events for these manipulation will still fire on the div to serve as user intent and it'll be editors's responsibility to handle the editing operations. 

Here are several key points when a div is associated with an EditContext:
* The div won't receive any input event, and no text input will directly manipulate the DOM.
* The div will receive all beforeinput events  as if it were a contentEditable div except beforeinput(insertCompositionText).
* The InsertText, deleteContentBackward and deleteContentForward input event are replaced by TextUpdate event fired on the EditContext. The corresponding beforeinput event can be used to cancel the operation.
* CompositionStart and CompositionEnd are fired on the EditContext. There is no CompositionUpdate event.
* A new event TextFormatUpdate is fired on the EditContext.
* Caret navigation will happen in the DOM space and the web authors will need to map the selection change from the DOM space to the plain text space if they choose to use native selection.

The following table summarizes the difference between div with contentEditable and div with EditContext for each common editing commands:
| |	\<div contentEditable>  | 	\<div> with EditContext |
| --- | ----------------------- | ------------------------- |
| div gets focus (by clicking or .focus()) |	<ul><li>Show focus ring</li><li>Show blinking caret</li></ul> |	<ul><li>Show focus ring</li><li>Show blinking caret</li></ul> |
|English typing |<ul><li>beforeinput (insertText) -> div</li><li>div.innerHTML gets updated</li><li>input (insertText) -> div </li> | <ul><li>beforeinput (insertText) -> div</li><li>editContext.text gets updated</li><li>textupdate -> EditContext</li> |
|Backspace |<ul><li>beforeinput (deleteContentBackward) -> div</li><li>div.innerHTML gets updated</li><li>input (deleteContentBackward) -> div </li> | <ul><li>beforeinput (deleteContentBackward) -> div</li><li>editContext.text gets updated</li><li>textupdate -> EditContext</li> |
|Delete |<ul><li>beforeinput (deleteContentForward) -> div</li><li>div.innerHTML gets updated</li><li>input (deleteContentForward) -> div </li> | <ul><li>beforeinput (deleteContentForward) -> div</li><li>editContext.text gets updated</li><li>textupdate -> EditContext</li> |
|Very first Composition input|<ul><li>Compositoinstart -> div</li><li>beforeinput (insertCompositionText) -> div</li><li>Compositionupdate -> div</li><li>div.innerHTML gets updated</li><li>input (insertCompositionText) -> div</li> |<ul><li> compositionstart -> EditContext</li><li>editContext.text gets updated</li><li>textupdate -> EditContext</li><li>textformatupdate -> EditContext</li> |
| During composition (text input and arrow keys) | <ul><li>beforeinput (insertCompositionText) -> div</li><li>Compositionupdate -> div</li><li>div.innerHTML gets updated</li><li>input (insertCompositionText) -> div</li></ul> | <ul><li>editContext.text gets updated</li><li>textupdate -> EditContext</li><li>textformatupdate -> EditContext</li></ul> |
| Commit comosition (hit Enter)| <ul><li>beforeinput (insertCompositionText) -> div</li><li>Compositionupdate -> div</li><li>div.innerHTML gets updated</li><li>input (insertCompositionText) -> div</li><li>Compositoinend -> div</li></ul> | <ul><li>editContext.text gets updated</li><li>textupdate -> EditContext</li><li>textformatupdate -> EditContext</li><li>compositionend -> EditContext</li></ul> |
| Ctrl+B / Ctrl+I / etc. | <ul><li>beforeinput (formatBold) -> div</li><li>div.innerHTML gets updated</li><li>input (formatBold) -> div</li></ul>|<ul><li>beforeinput (formatBold) -> div</li></ul> |
|Arrow keys (with shift) / Home / End / PageUp / PageDown / etc.|<ul><li>caret/selection is updated</li><li>selectionchange -> document</li></ul>|<ul><li>caret/selection is updated (in DOM space)</li><li>selectionchange -> document</li><li>EditContext's selection is NOT auto updated</li><li>It will require web authors to map selection position from DOM space to EditContext's plain text space</li></ul>|
|Mouse click (with shift)|<ul><li>caret/selection is updated</li><li>selectionstart</li><li>selectionchange -> document</li></ul>|<ul><li>caret/selection is updated (in DOM space)</li><li>selectionchange -> document</li><li>EditContext's selection is NOT auto updated</li></ul>|
|Spell check replacement|<ul><li>beforeinput (insertReplacementText) -> div</li><li>div.innerHTML gets updated</li><li>input (insertReplacementText) -> div</li></ul>|<ul><li>beforeinput (insertReplacementText) -> div</li></ul>|
|Drag & drop selected words|<ul><li>beforeinput (deleteByDrag) -> div</li><li>input (deleteByDrag) -> div</li><li>beforeinput (insertFromDrop) -> div</li><li>div.innerHTML gets updated</li><li>input (insertFromDrop) -> div</li></ul>|<ul><li>beforeinput (deleteByDrag) -> div</li><li>beforeinput (insertFromDrop) -> div</li></ul>|
|Cut (ctrl+x)|<ul><li>beforeinput (deleteByCut) -> div</li><li>div.innerHTML gets updated</li><li>input (deleteByCut) -> div</li></ul>|<ul><li>beforeinput (deleteByCut) -> div</li></ul>|
|Copy|n/a|n/a|
|Paste (ctrl+v)|<ul><li>beforeinput (insertFromPaste) -> div</li><li>div.innerHTML gets updated</li><li>input (insertFromPaste) -> div</li></ul>|<ul><li>beforeinput (insertFromPaste) -> div</li></ul>|

## EditContext Usage
### Example 1: Initialization
```javascript
    // This will make the div behave like a ContentEditable div except the user input will go to 
    // EditContext instead of the div, i.e., the div will receive beforeInput events, will be focusable, etc
    // but the DOM won't be changed while user typing.
    var editContext = new EditContext();
    div.editContext = editContext;
    // When the associated element is focused, the EditContext is automatically activated.
    div.focus();
```

### Example 2: Event handler
```javascript
    // When user typing, EditContext will receive textupdate events which has text info that can be used to
    // update the editor's model, or direclty update the DOM (as shown in this example)
    editContext.addEventListener("textupdate", e => {
        let s = document.getSelection();
        let textNode = s.anchorNode;
        let offset = s.anchorOffset;
        let string = textNode.textContent;
        // update the text Node
        textNode.textContent = string.substring(0, offset) + e.updateText + string.substring(offset);
    });

    // EditContext will also receive textformatupdate event for IME decoration.
    // Ex. thin/thick underline for the "phrase mode" in Japanese IME.
    editContext.addEventListener("textformatupdate", e => { 
        decoration.style.borderBottom = "3px " + e.underlineStyle;
    });
```
### Example 3: Mapping the selection from DOM space to EditContext (plain text) space
```javascript
    document.addEventListener("selectionchange", e => {
        let s = document.getSelection();

        // Calculate the offset in plain text
        let range = document.createRange();
        range.setEnd(s.anchorNode, s.anchorOffset);
        range.setStartBefore(parentSpan);
        let plainText = range.toString();

        // EditContext doesn't handle caret navigation, so all the caret navigation/selection happened
        // in DOM space will need to be mapped to plain text space by web authors and passed to EditContext.
        editContext.updateSelection(plainText.length, plainText.length);
    });
```

### Example 4: Update the control bounds and selection bounds for IME
```javascript
        // IME will need the control bounds (i.e. the conceptual location of the EditContext in the view)
        // and the selection bounds (if no selection, it will be the bounding box for the caret) to show the
        // candidate window in the right position. The bounds are in the client coordinate space.
        let controlBound = editView.getBoundingClientRect();
        let s = document.getSelection();
        let selectionBound = s.getRangeAt(0).getBoundingClientRect();
        editContext.updateLayout(controlBound, selectionBound);
```

## Example Application
This [example](canvas_editContext.html) shows how an author can use EditContext to implement (IME) typing on a &lt;canvas&gt; element. ([demo video](EditContext_tpac2021.mp4))

This [example](native_selection_demo.html) shows how an author can leverage native selection when using EditContext.

## Interaction with Other Browser Editing Features
By decoupling the view from text input, the EditContext opts out of some editing behaviors that are currently only available through the DOM. An inventory of those features and their interaction with the EditContext follows:

 * Spellcheck
 * Undo
 * Focus
 * Built-in Editing Commands that Manipulate the DOM in Response to User Input
 * Default Key Event Behavior Adaptations for Editing
 * Touch-specific Editing Behaviors
 * Native Selection and Caret
 * Highlighting

### Spellchecking
Web apps have no way today to integrate with spellcheck from the browser except through editable elements. Using the EditContext will make the native spellchecking capabilities of the browser unreachable.  There is demand for an independent spellchecking API.

For web apps or editing frameworks relying on editable elements to provide this behavior, it may be a barrier to adoption of the EditContext. Note, however, there are heavily used web editing experiences (Office Online apps, Google docs) that have replaced spell checking with a custom solution who will not be blocked from adopting a better text input integration story, even in the absence of a separate spellcheck API.  Similarly, there are also editing experiences, e.g. Monaco, that don't use spell checking from the browser because an element like a contenteditable won't understand what's a string and what's a class name leading to a lot of extra innappropriate squiggles in the code editing experience.

### Undo
Web-based editors rarely want the DOM undo stack. Undo reverses the effect of DOM operations in an editable element that were initiated in response to user input.  Since many editors use the editable element to capture text input from the user, but use JavaScript operations to update the view in response to that input, undoing only the DOM changes from user input rarely makes sense.

It is expected that web-based editors using the EditContext will provide their own undo operations.  Some performance benefit should be realized as DOM operations will no longer incur the overhead of maintaining a valid undo stack as DOM mutations mix with user-initiated (undoable) actions.

### Focus
The notion of focus in the DOM, which determines the target for KeyboardEvents, is unaffected by the EditContext.  DOM elements can remain focused while the EditContext serves as the recipient of composition and textupdate events.

### Built-in Editing Commands that Manipulate the DOM in Response to User Input
Web-based editors which use the EditContext are expected to provide their own editing command implementations.  For example, typing Enter on the keyboard will not automatically insert a newline into the HTML view.  An editor must handle the KeyboardEvent and perform updates to their own document model and render those changes into the HTML DOM for users to see the impact of the Enter key press.

As an alternative, basic editing command implementations could be implemented and expressed as textupdate events to the EditContext's cached text view.  Such a feature may make it easier for web-based editors to adopt since the EditContext will behave more like the hidden text area without the side effects.

However, if the EditContext did provide more editing behavior, it may not be used by editors since a key press like Enter or Backspace is often associated with editing heuristics such as ending or outdenting a list, turning a heading into a normal paragraph style, inserting a new table row, removing a hyperlink without removing any characters from the URL, etc.

The current thinking is that a more minimal approach is a better place to start.

### Default Key Event Behavior Adaptations for Editing
Some KeyboardEvents are associated with different default behaviors when an editable element is focused than when a read-only element is focused.  As an example, the spacebar inserts a space in editable elements, but scrolls when a read-only element is focused.

When an EditContext is active, the web platform will treat the set of KeyboardEvents with special editing behaviors as though the default behavior has been prevented, i.e. there will be no need for the author to call preventDefault to prevent scrolling when a Space key is pressed.

### Touch-specific Editing Behaviors
Some browsers may support double-tap to zoom.  When double tap occurs on editable text, however, it is commonly used to select the word under the double tap.  Editors using read-only elements in conjunction with an EditContext can employ the touch-action CSS property to eliminate unwanted touch behavior.

### Native Selection and Caret
Web-based editors using the EditContext that also want to use native selection and the caret don't currently have a great solution.  There are two problems in particular that must be overcome:

1. A native caret currently can only be rendered in an editable region, so using an EditContext in combination with a read-only element in the DOM doesn't support a native caret.
2. Native selection is constrained to stay within the bounds of an editable element.  This is likely expected behavior, but no such restriction is placed on read-only elements which could lead to over selection without an editable element that establishes a selection limit.

#### Option 1
New DOM content attributes could be proposed to constrain selection to a subtree of the DOM and allow display of the native caret.

#### Option 2
Editors implement their own selection and caret using DOM elements or the proposed [Highlight API](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/master/highlight/explainer.md).

Option 2 is the default and may be the best starting point.  It is currently employed by multiple editors as those editors offer specialized behavior related to selection: e.g. multiple insertion point support or rectangular selection or table selection.

#### Option 3
An editor could combine a contenteditable element with an EditContext. This has the advantage of overcoming both selection related challenges: constraining selection and displaying the native caret. It, however, has the disadvantage that editing behaviors not disabled by having an EditContext, for example clipboard paste and drag and drop, may result in DOM mutations which could break editors.

### Highlighting
Editable elements can apply paint-time effects to mark an active composition and spellchecking results. These features won't happen automatically for web-based editors using the EditContext. Instead, additional elements can be added to the DOM to render these effects, or, when available, the proposed [Highlight API](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/master/highlight/explainer.md) can be used.

## Alternatives:
Multiple approaches have been discussed during F2F editing meetings and through online discussions.

* New `contenteditable` attributes: The group has [considered](https://w3c.github.io/contentEditable/) adding new attribute values to contenteditable (events, caret, typing) that in would allow web authors to prevent certain input types or to modify some input before it has made it into the markup. These proposals continue to couple text input with the view which has limitations discussed above that the EditContext aims to overcome.

* `beforeInput` event: [Level 1](https://www.w3.org/TR/input-events-1/) (Blink implementation) and [Level 2](https://www.w3.org/TR/input-events-2/) (Webkit implementation). The idea behind this event was to allow authors greater insight into the user's intent, and to allow editors to handle that intent without needing to intercept all the arcs through which that input could have been initiated, e.g. context menus, keyboard shortcuts, shaking the phone to undo, etc.  This approach makes it easier to handle various events but still leaves text input coupled with the view.

* As an alternative to `beforeInput` Google has proposed a roadmap in [Google Chrome Roadmap Proposal](https://docs.google.com/document/d/10qltJUVg1-Rlnbjc6RH8WnngpJptMEj-tyrvIZBPSfY/edit) that suggests some potential subprojects to improve editing and textinput in the browser.  One concept in particular was described as a something like a hidden textarea that is decoupled from the view.  This proposal aligns well with that thinking.

# Appendix
## Example Text Input Methods
### Virtual Keyboard Shape-writing
![VK shape-writing](Shape-writing.gif)

### Handwriting Recognition
![Handwriting Recognition](Handwriting-recognition.gif)

### Emoji Picker
![Emoji Picker](Emoji-picker.gif)

### IME Composition
![IME Compositions](Composition.gif)

### Dictation
![Dictation](dictation.png)
---
[Related issues](https://github.com/MicrosoftEdge/MSEdgeExplainers/labels/EditContext) | [Open a new issue](https://github.com/MicrosoftEdge/MSEdgeExplainers/issues/new?title=%5BEditContext%5D)
