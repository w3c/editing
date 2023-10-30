# Async Clipboard API: Read unsanitized HTML.


## Author:
*   ansollan@microsoft.com
*   snianu@microsoft.com

## Introduction
HTML content is essential for supporting copy/paste operation of high fidelity content from native apps to web sites and vice versa, especially in sites supporting document editing. DataTransfer object's `getData` and async clipboard `read()` methods have interop differences in how the HTML content is sanitized during a paste operation. The `getData` method returns unsanitized HTML content, but the `read()` method uses the browser's sanitizer to strip out content (ex. global `<style>`s, `<script>`s, `<meta>` tags) from the HTML markup which results in format loss, bloating of payload due to inlining of styles etc.

Currently sites are using the DataTransfer object's `getData` method to read unsanitized HTML content, so sites do not want to regress HTML paste operation by migrating to async clipboard `read()` method. It'd be beneficial for the web authors if async clipboard `read()` method and `getData` methods provide similar level of fidelity of HTML content during paste operations.

Web custom formats can be used to exchange unsanitized HTML if both source and target apps have support for it, but there are many native apps that don't have support for web custom formats, so contents copied from these apps in the HTML format would have to go through the Browser sanitizer in `read()` that would result in loss of fidelity.

## Goals
*   Preserve copy/paste fidelity when reading/writing the HTML format on the clipboard.
*   Have parity with the existing DataTransfer object's `getData`method.
*   Build on the existing Async Clipboard API, by leveraging existing:
    *   Structure, like asynchronous design and ClipboardItem.
    *   Protections, like permissions model, and secure-context/active-frame requirements of the API.

## Non-goals
*   Modify design of original Async Clipboard API, where not relevant to unsanitized html format.
*   Add support for unsanitized read/write of other [supported formats](https://w3c.github.io/clipboard-apis/#mandatory-data-types-x) that is not `text/html`.
*   Drag-and-Drop APIs.

## Additional Background

HTML format is being supported by three APIs:

### DataTransfer object's getData
The `DataTransfer` object can be accessed via the paste event handler and `getData` can be used to get the clipboard data in a specific format. Authors can call `preventDefault` to prevent the browser's default paste action and create their own app-specific paste implementation. The `getData` API does not perform sanitization and always returns unsanitized HTML to the caller. E.g.
```js
document.addEventListener('paste', function(e) {
    e.clipboardData.getData('text/html');
    e.preventDefault();
});
```

### Copy/paste execCommand
`execCommand` is used to invoke the copy/paste command which uses the browser's default logic to read/write the clipboard content.

```js
pasteExecCommandBtn.addEventListener("click", function(e) {
  var pasteTarget = document.createElement("textarea");
  pasteTarget.contentEditable = true;
  document.body.appendChild(pasteTarget);
  pasteTarget.focus();
  const result = document.execCommand("paste");
});

```

### Async HTML read APIs
This API is called via the `navigator.clipboard` object and is used to read HTML to the clipboard asynchronously without listening for a clipboard event or calling `execCommand`. This provides more flexibility and better performance to web authors than the other APIs. E.g.

```js
paste.onclick = async () => {
    try {
        const clipboardItems = await navigator.clipboard.read();
        const clipboardItem = clipboardItems[0];
        const customTextBlob = await clipboardItem.getType('text/html');
        logDiv.innerText = await customTextBlob.text();
        console.log('Text pasted.');
        } catch(e) {
        console.log('Failed to read clipboard');
        }
};
```
All of the above-mentioned APIs should allow web authors to read HTML content with equally high fidelity.

## Paste HTML content using getData

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
When content is copied in the `text/html` MIME type via `setData` method, Safari inserts both sanitized & unsanitized versions of html content. It inserts the unsanitized html content into a custom webkit format type(`com.apple.Webkit.custom-pasteboard-data`), but the built-in `public.html` format contains the sanitized fragment. When `getData` is called from a site that is within the same origin as copy, the HTML content in the custom webkit format type is returned (makes round tripping possible). For cross-origin sites, the sanitized HTML fragment is returned from the `public.html` format.

### In Chromium & FF:
When `getData` is called, the HTML string is read without sanitization i.e. global styles, script tags, meta tags are not removed from the markup. On Windows, it also contains the header information which is hardcoded([`ui::clipboard_util::HtmlToCFHtml`](https://source.chromium.org/chromium/chromium/src/+/main:ui/base/clipboard/clipboard_util_win.cc;drc=9cc9ba08c27cb1172fb4a876ceb432f72bebfe72;l=845)) during copy and then written to the clipboard.

## Proposal

With this new proposal, we will be introducing a new `unsanitized` parameter in the [read()](https://w3c.github.io/clipboard-apis/#dom-clipboard-read) method so the HTML content can be read without any loss of information i.e. `read()` would return the content without any sanitization.

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

### Read()
Follow the algorithm specified in [read()](https://w3c.github.io/clipboard-apis/#dom-clipboard-read) except for the below steps:
1. If `text/html` representation is present in the [ClipboardItem](https://w3c.github.io/clipboard-apis/#clipboard-item-interface) and `text/html` is present in the `unsanitized` list, then follow the below steps:
    1. If size of `unsanitized` list is greater than 1, then throw `Reading multiple unsanitized formats is not supported.` exception.
    2. If `text/html` is not at the first position in the `unsanitized` list, then throw `The unsanitized type` {formatName} `is not supported.` exception.
    3. else, return the blobData as-is without any sanitization.
2. Else, follow the existing sanitization behavior as mentioned in [step-3](https://w3c.github.io/clipboard-apis/#dom-clipboard-read).

### JS example

```js
const html_text = new Blob(['<html><head><meta http-equiv=Content-Type content=\"text/html; charset=utf-8\"><meta name=ProgId content=Excel.Sheet><meta name=Generator content=\"Microsoft Excel 15\">'
'<style>body {font-family: HK Grotesk; background-color: var(--color-bg);}</style></head><body><div>hello</div></body></html>'], {type: 'text/html'});

const clipboard_item = new ClipboardItem({
'text/html': html_text     /* Sanitized format. */
});
              
await navigator.clipboard.write([clipboard_item]);

// Read the unsanitized HTML format using the `unsanitized` option.
const clipboardItems = await navigator.clipboard.read({ unsanitized: ['text/html'] });
const blobOutput = await clipboardItems[0].getType('text/html');

```

## Privacy and Security
This feature introduces an `unsanitized` option that has unsanitized `text/html` content. This will be exposed to both native apps and websites.

Websites or native apps are already reading unsanitized content via DataTransfer APIs using `getData()` method. In this proposal, web authors are required to explicitly specify `unsanitized` option in the async clipboard `read()` method to access the raw `text/html` content from the clipboard. This feature uses async clipboard API that has a [user gesture requirement](https://w3c.github.io/clipboard-apis/#check-clipboard-read-permission) on top of [existing](https://github.com/dway123/clipboard-pickling/blob/main/explainer.md#permissions) async clipboard API security measures to mitigate security and privacy concerns.

For more details see the [security-privacy](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/ClipboardAPI/tag-security-privacy-clipboard-unsanitized-read.md) doc.

[Here](https://docs.google.com/document/d/1QLt50Q8UnlQksVltZ2PNkDZVdk9N58Pq7P0lzGTKh-U/edit?usp=sharing) is a threat model document for this feature.

Some [examples](https://docs.google.com/document/d/1O2vtCS23nB_6aJy7_xcdaWKw7TtqYm0fERzEjtLyv5M/edit?usp=sharing) of native apps that do sanitization themselves during paste.

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
    *   Google Sheets : Positive

### Excel's issues with sanitization

[Custom Office styles are stripped out](https://drive.google.com/file/d/1Nsyp1rUKc_NF4l0n-O05snAKabHAKeiG/view) if the default sanitizer is used to read HTML data from the clipboard. These styles are inserted by Excel app that are used to preserve excel specific semantics.
Additional problems are discussed in [this](https://docs.google.com/document/d/1nLny6t3w0u9yxEzusgFJSj-D6DZmDIAzkr1DdgWcZXA/edit?usp=sharing) doc.

### Google Sheet's issues with sanitization

crbug.com/1493388: The empty table cells are dropped because of a bug in the sanitizer.

## References & acknowledgements
Many thanks for valuable feedback and advice from:
*   jsbell@chromium.org
*   mek@chromium.org
*   pwnall@chromium.org
*   estade@chromium.org
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

