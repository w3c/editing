# Unsanitized HTML for Async Clipboard API


## Author:
*   ansollan@microsoft.com
*   snianu@microsoft.com

## Introduction
Using DataTransfer object's setData and async clipboard write method, there are interop differences in how the HTML content is sanitized and written to the clipboard. It'd be beneficial for the web authors if async clipboard and setData APIs provide the same HTML content during copy operation so round tripping is possible without any interop differences.
Also creating a fragment and inlining the styles bloats the payload and [strips out the custom styles](https://drive.google.com/file/d/1Nsyp1rUKc_NF4l0n-O05snAKabHAKeiG/view) inserted by sites like Excel online that are used to preserve excel specific semantics.

## Goals
*   Interoperability with legacy DataTransfer API used to read/write HTML format.
*   Preserve privacy, by requiring user gesture to avoid unintended data leakage.
*   Build on the existing Async Clipboard API, by leveraging existing:
    *   Structure, like asynchronous design and ClipboardItem.
    *   Protections, like permissions model, and secure-context/active-frame requirements of the API.

## Non-goals
*   Modify design of original Async Clipboard API, where not relevant to unsanitized html format.
*   Add support for unsanitized read/write of other [supported formats](https://w3c.github.io/clipboard-apis/#mandatory-data-types-x) that is not `text/html`.
*   Drag-and-Drop APIs.

## Additional Background
HTML content is essential for supporting copy/paste operation of high fidelity content from native apps to web sites and vice versa, especially in sites supporting document editing. Currently it is being supported by three APIs:

### DataTransfer object's setData
DataTransfer object can be accessed via the copy/paste event handler. It can then be used to set the clipboard data and preventDefault the browser's default copy operation. That way authors have some control over the HTML content that they want the browser to write to the native clipboard. E.g.
```js
document.addEventListener('copy', function(e) {
            e.clipboardData.setData('text/html', '<p>hello</p>');
            e.preventDefault();
        });
```

### Copy/paste execCommand
`execCommand` is used to invoke the copy/paste command which uses the browser's default logic to read/write the clipboard content.

### Async HTML read/write APIs
This API is called via navigator.clipboard object and is used to read/write HTML to the clipboard asynchronously without depending on clipboard event or execCommand implementation. This provides more flexibility to the web authors in terms of the type of the HTML content and when the data needs to be read/written to the clipboard. E.g.

```js
async () => { 
try {
const html_text = new Blob([
                  '<html><head><meta http-equiv=Content-Type content=\"text/html; charset=utf-8\"><meta name=ProgId content=Excel.Sheet><meta name=Generator content=\"Microsoft Excel 15\"><style>display:none</style></head></html>'], {type: 'text/html'});
navigator.clipboard.write([
                new ClipboardItem({
                    "text/html": html_text
                }),
            ]);
} catch(e) {
}
}
```
Using any of the above mentioned APIs, web authors should be able to round trip HTML content and also be compatible with other browsers.

## Copy HTML text using setData

### Chrome
```
Version:0.9
StartHTML:0000000105
EndHTML:0000000509
StartFragment:0000000141
EndFragment:0000000473
<html>
<body>
<!--StartFragment--><html><head><meta http-equiv=Content-Type content="text/html; charset=utf-8"><meta name=ProgId content=Excel.Sheet><meta name=Generator content="Microsoft Excel 15"><style>table {height=10px}</style></head><body link="#0563C1" vlink="#954F72"><p style='color: red; font-style: oblique;'>This text was copied using </p></body></html><!--EndFragment-->
</body>
</html>

```

### Firefox
```
Version:0.9
StartHTML:00000097
EndHTML:00000499
StartFragment:00000131
EndFragment:00000463
<html><body>
<!--StartFragment--><html><head><meta http-equiv=Content-Type content="text/html; charset=utf-8"><meta name=ProgId content=Excel.Sheet><meta name=Generator content="Microsoft Excel 15"><style>table {height=10px}</style></head><body link="#0563C1" vlink="#954F72"><p style='color: red; font-style: oblique;'>This text was copied using </p></body></html><!--EndFragment-->
</body>
</html>
```

### Safari
In standard html format, Safari inserts both sanitized & unsanitized version of html content. It inserts the html content provided in the setData API into the clipboard using a custom webkit format type(`com.apple.Webkit.custom-pasteboard-data`). When `getData` is called, the HTML content in the custom webkit format type is returned (makes round tripping possible).

### In Chromium & FF:
During `setData` call, the HTML string is written without sanitization i.e. we don't remove tags such as `<meta>, <script>, <style>` etc from the HTML markup provided in the `setData`.
In Chromium, the header of the HTML is hardcoded([`ui::clipboard_util::HtmlToCFHtml`](https://source.chromium.org/chromium/chromium/src/+/main:ui/base/clipboard/clipboard_util_win.cc;drc=9cc9ba08c27cb1172fb4a876ceb432f72bebfe72;l=845)) and then written to the clipboard.

## Copy HTML text using async clipboard write
```
Version:0.9
StartHTML:0000000105
EndHTML:0000000252
StartFragment:0000000141
EndFragment:0000000216
<html>
<body>
<!--StartFragment--><p style="color: red; font-style: oblique;">This text was copied </p><!--EndFragment-->
</body>
</html>

```
Async clipboard writer API uses sanitizers to strip out content such as `<meta>, <style>, <script>` tags etc  from the HTML. This creates issues as it's not interop with DataTransfer's `setData` API so web authors that use `setData` (to write HTML) and async clipboard api (to write other formats) don't get the same content compared to using just the async clipboard write APIs for both HTML and other formats.

## Copy HTML text using copy command
```
Version:0.9
StartHTML:0000000170
EndHTML:0000000770
StartFragment:0000000206
EndFragment:0000000734
SourceURL:file:///C:/Users/snianu.REDMOND/Downloads/index0.html
<html>
<body>
<!--StartFragment--><span style="color: rgb(0, 0, 0); font-family: &quot;Times New Roman&quot;; font-size: medium; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;">Some text</span><!--EndFragment-->
</body>
</html>

```

Here the clipboard content is sanitized and tags such as `<meta>, <script>, <style>` etc are not included while copying contents to the clipboard.
Another issue for HTML write: If web authors want to write the entire HTML markup using async clipboard write, then currently in Chromium it fails silently. E.g.
```js
async () => {
try {
      const html_text = new Blob([
                  '<html><head><meta http-equiv=Content-Type content=\"text/html; charset=utf-8\"><meta name=ProgId content=Excel.Sheet><meta name=Generator content=\"Microsoft Excel 15\"><style>display:none</style></head></html>'], {type: 'text/html'});
navigator.clipboard.write([
                new ClipboardItem({
                    "text/html": html_text
                }),
]);
} catch(e) {}
}

```

## Proposal

With this new proposal, we will be introducing a new `unsanitized` parameter in the [read()](https://w3c.github.io/clipboard-apis/#dom-clipboard-read) method so the content is round trippable i.e. `read()` would return the content without any sanitization. On [write](https://w3c.github.io/clipboard-apis/#dom-clipboard-write) method call, we will always write unsanitized HTML content if `text/html` is provided in the [ClipboardItem](https://w3c.github.io/clipboard-apis/#clipboard-item-interface).

### IDL changes
```
dictionary ClipboardUnsanitizedFormats {
    sequence<DOMString> unsanitized;
};

[
    SecureContext,
    Exposed=Window
] interface Clipboard : EventTarget {
    [CallWith=ScriptState]
    Promise<sequence<ClipboardItem>> read(ClipboardUnsanitizedFormats formats);
};

```

### Write(data)
Follow the algorithm specified in [write](https://w3c.github.io/clipboard-apis/#dom-clipboard-write) except for the below steps:
1. If `text/html` representation is present in the [ClipboardItem](https://w3c.github.io/clipboard-apis/#clipboard-item-interface), then store the blobData as-is without any sanitization.
2. On Windows follow the below platform specific header format before writing it to the system clipboard:
```
Version:0.9
StartHTML:<start offset of the start html tag>
EndHTML:<start offset of the end html tag>
StartFragment:<start offset of the start fragment comment tag>
EndFragment:<start offset of the end fragment comment tag>
<!--StartFragment-->
<html>
<head>
<head content goes here>
</head>
<body>
<body content goes here>
</body>
</html>
<!--EndFragment-->

```

### Read()
Follow the algorithm specified in [read()](https://w3c.github.io/clipboard-apis/#dom-clipboard-read) except for the below steps:
1. If `text/html` representation is present in the [ClipboardItem](https://w3c.github.io/clipboard-apis/#clipboard-item-interface) and `text/html` is present in the `unsanitized` list, then follow the below steps:
    1. If size of `unsanitized` list is greater than 1, then throw `Reading multiple unsanitized formats is not supported.` exception.
    2. If `text/html` is not at the first position in the `unsanitized` list, then throw `The unsanitized type` {formatName} `is not supported.` exception.
    3. else, return the blobData as-is without any sanitization.
2. Else, follow the existing sanitization behavior as mentioned in [step-3](https://w3c.github.io/clipboard-apis/#dom-clipboard-read).

### JS example

```js
const html_text = new Blob([
                  '<html><head><meta http-equiv=Content-Type content=\"text/html; charset=utf-8\"><meta name=ProgId content=Excel.Sheet><meta name=Generator content=\"Microsoft Excel 15\"><style>body {font-family: HK Grotesk; background-color: var(--color-bg);}</style></head><body><div>hello</div></body></html>'], {type: 'text/html'});

              const clipboard_item = new ClipboardItem({
                'text/html': html_text     /* Sanitized format. */
              });
              
              navigator.clipboard.write([clipboard_item]);

```

### Clipboard output on Windows

```
Version:0.9
StartHTML:0000000105
EndHTML:0000000436
StartFragment:0000000400
EndFragment:0000000400
<!--StartFragment-->
<html>
<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="ProgId" content="Excel.Sheet"><meta name="Generator" content="Microsoft Excel 15"><style>body {font-family: HK Grotesk; background-color: var(--color-bg);}</style>
</head>
<body><div>hello</div>
</body>
</html>
<!--EndFragment-->

```

## Privacy and Security
This feature introduces an `unsanitized` option that has unsanitized `text/html` content. This will be exposed to both native apps and websites.

Websites or native apps are already reading unsanitized content via DataTransfer APIs using `setData()` & `getData()` methods. In this proposal, web authors are required to explicitly specify `unsanitized` option in the async clipboard `read()` method to access the raw `text/html` content from the clipboard. This feature uses async clipboard API that already has a [user gesture requirement](https://w3c.github.io/clipboard-apis/#check-clipboard-read-permission) on top of [existing](https://github.com/dway123/clipboard-pickling/blob/main/explainer.md#permissions) async clipboard API security measures to mitigate security and privacy concerns.

For more details see the [security-privacy](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/ClipboardPickle/tag-security-privacy.md) doc.

### User Gesture Requirement
On top of Async Clipboard API requirements for focus, secure context, and permission, use of this API will require a [transient user activation](https://html.spec.whatwg.org/multipage/interaction.html#transient-activation), so that the site will not be able to silently read or write clipboard information.

This requirement is now enforced for the Async Clipboard API overall. It may be notable that Safari already requires a user gesture for all Async Clipboard API interactions.

### Permissions
Due to concerns regarding permission fatigue and comprehensibility, and due to the limited utility of a permission, no new permission would be implemented for unsanitized clipboard. Given that Clipboard API read and write are already permitted, unsanitized clipboard read and write will be permitted as-is.

## Stakeholder Feedback / Opposition
*   Implementers:
    *   Firefox : [Neutral](https://github.com/w3c/clipboard-apis/issues/150#issuecomment-1031684598).
    *   Safari : [Negative](https://github.com/w3c/clipboard-apis/issues/150#issuecomment-974594001)
*   Stakeholders:
    *   Excel Online : Positive
    *   Adobe : Positive

More discussion on this proposal: https://github.com/w3c/clipboard-apis/issues/165, 

## References & acknowledgements
Many thanks for valuable feedback and advice from:
*   jsbell@chromium.org
*   mek@chromium.org
*   pwnall@chromium.org
*   pcupp@microsoft.com
*   [annevk](https://github.com/annevk)

Reference Documents:
*   Github link to the issue
    *   [Issue](https://github.com/w3c/clipboard-apis/issues/150)
*   Various format descriptions
    *   [Format Descriptions](https://docs.google.com/spreadsheets/d/16GxpRzx77NaLTKsU5e1CZVtA5ehvxpZVFmJ-02A0uxs/edit#gid=0)
*   Raw Clipboard (a previous, related effort):
    *   [Explainer](https://github.com/WICG/raw-clipboard-access/blob/master/explainer.md)
    *   [Design document](https://tinyurl.com/raw-clipboard-access-design)
*   Pickling API (a previous, related effort):
    *   [Explainer](https://github.com/w3c/editing/blob/gh-pages/docs/clipboard-pickling/explainer_previous.md)

