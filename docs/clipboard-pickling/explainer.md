# Web Custom formats for Async Clipboard API


## Author:
*   huangdarwin@chromium.org
*   snianu@microsoft.com

## Link to the old proposal

[Pickling API](explainer_previous.md)

## Introduction
Powerful web applications would like to exchange data payloads with web and native applications via the OS clipboard (copy-paste). The existing Web Platform has an API that supports the most popular standardized data types (text, image, rich text) across all platforms. However, this API does not scale to the long tail of specialized formats. In particular, custom formats, non-web-standard formats like TIFF (a large image format), and proprietary formats like .docx (a document format), are not supported by the current Web Platform. Web custom formats for Async Clipboard API aims to provide a solution to this problem, by letting web applications read and write custom, unsanitized, web-originated payloads using a standardized web custom format.

Web custom formats could be used by:
*   Web Apps to support popular but not-web-standardized formats like GIFs, like [Figma](https://crbug.com/150835#c73) or Photopea.
*   Web Apps to support application-specific types, for example to copy and paste within or between Google Docs and Google Sheets, (or Office 365’s Word and Excel products) using custom formats.
*   Developers owning both a web and native application, like SketchUp, to communicate between their applications.

The existing Async Clipboard API is still encouraged for use cases requiring only standardized types already supported by the web platform as it is easier to use and the types are widely-interoperable with existing applications, but custom formats allow web applications with more specific or sophisticated clipboard needs to meet those needs.

## Goals
*   Allow sites to represent and interact with more clipboard formats, with fine-grained control. These types will:
    *   Be placed on the operating system clipboard, to allow for communication between different browsers, and between web and native applications.
    *   Be custom, web-originated formats, specified by the site.
    *   Not be sanitized by the browser, to prevent information loss during sanitization.
*   Preserve user security, by preventing these formats from interoperating with or compromising legacy native applications.
*   Preserve privacy, by requiring user gesture to avoid unintended data leakage.
*   Build on the existing Async Clipboard API, by leveraging existing:
    *   Structure, like asynchronous design and ClipboardItem.
    *   Protections, like permissions model, and secure-context/active-frame requirements of the API.

## Non-goals
*   Allow interoperability with legacy native applications, without update. This was explored in a [raw clipboard proposal](https://github.com/WICG/raw-clipboard-access/blob/master/explainer.md), and may be explored further in the future, but comes with significant security challenges (remote code execution in system native applications).
*   Modify design of original Async Clipboard API, where not relevant to web custom types.
*   Anything not related to Async Clipboard API, including the DataTransfer API or Drag-and-Drop. Web custom formats as described in this explainer should be extensible to also work for Drag-and-Drop, but this explainer's scope is limited to clipboard.

## Additional Background
This design aims to allow access to custom, web-originated formats. WebKit, Blink & Firefox offer unstandardized (and minimally documented) implementations of custom formats. This proposal aims not only to add this support to the Async Clipboard API, but also to standardize such behavior, opening up related unstandardized DataTransfer implementations to become standardized in the future.

## Existing Async Clipboard API read and write
The existing [Async Clipboard API](https://w3c.github.io/clipboard-apis/#async-clipboard-api) already provides for reading or writing multiple items from or to the clipboard.

Existing Async Clipboard API write call:
```js
const image = await fetch('myImage.png').then(response => response.blob())
const text = new Blob(['this is alternative image text'], {type: 'text/plain'})
const item = new ClipboardItem({'text/plain': text, 'image/png': image})
await navigator.clipboard.write([item])
```

Existing Async Clipboard API read call:
```js
const items = await navigator.clipboard.read()
const item = items[0]

if (item.types.includes("image/png")) {
  // prefer an image
  const image = await item.getType('image/png')
  // image handling code here...
}
else if (item.types.includes("text/plain")) {
  // handle text if no image available
  const text = await (await item.getType("text/plain")).text()
  // text handling code here...
}
```

## Custom Formats

The `ClipboardItem` constructor and the `ClipboardItem.getType()` method both take a string that represents a type. As this type is a MIME type it's formatted as `"type/subtype"`. The only types supported there are builtin types, such as "text/plain".

To extend this to allow arbitrary types, without impacting the processing of built-in types, which can be special depending on the user agent and its requirements, this proposal suggests introducing a namespace for arbitrary types. Arbitrary types will always have their data stored and read as-is, without any manipulation.

Arbitrary types are denoted by the prefix `"web "` (`"web"` followed by `U+0020 SPACE`) to distinguish them from builtin types. They are stored in an platform-specific way on the underlying OS clipboard and must not interfere with builtin types.  

It is important that implementations agree on the underlying OS representation of the data.  Without this agreement, native applications will not be able to exchange data with web apps across browser implementations.  A discussion of the recommended format by platform is included in the [detailed design section](#os-interaction-format-naming) of this document.

### Custom Format Write
To write custom formats, the author can use the Async Clipboard API per usual, but add the "web " prefix as discussed above.

In the example below, the author writes HTML in addition to their own "custom markup" to the clipboard.

```js
const html = "<html><head><style>color:blue</style><head><body><p>Hello</p></body></html>"
const html_blob = new Blob([html], {type: 'text/html'})

const custom_markup = "<custom_markup>pickled_text</custom_markup>"
const custom_blob = new Blob([custom_markup], {type: 'web text/custom'})

const item = new ClipboardItem({
 'text/html': html_blob,
 'web text/custom': custom_blob
})
navigator.clipboard.write([item])
```

### Custom Format Read
To read custom formats, the author can use the Async Clipboard API per usual, but add the "web " prefix as discussed above.

In the example below, the author prefers to use their "custom markup" if available, and otherwise will use a version of HTML, either from the web custom format version of the HTML or its well-known representation.

```js
const items = await navigator.clipboard.read()
const item = items[0]

if (item.types.includes("web text/custom")) {
  // prefer this web app's custom markup if available
  const custom_markup = await (await clipboardItem.getType("web text/custom")).text()
  // process the custom markup...
} 
else if (types.includes("web text/html")) {
  // native apps may write "web text/html" in addition to "text/html", prefer it
  const html = await (await clipboardItem.getType("web text/html")).text();
  // process the html...
} 
else if (types.includes("text/html")) {
  // process html if available
  const html = await (await clipboardItem.getType("text/html")).text();
  // process the html...
}
```

Note that native apps (or web apps) are free to provide an alternative form of well-known types by using the web keyword (as shown in the example above for HTML).  This practice may be useful in some cases, for example, if a legacy native app would like to provide an alternative version of a format that is already widely used. That native app may be unwilling to change its old representation, but can put a more modern, or easier for the web to consume, version in a "web" format.    

## Detailed design discussion

### OS-Interaction: Format Naming
Native applications will only be able to interact with these formats if they explicitly add support for these web custom formats. Different platforms / OS’s often have different conventions for a clipboard format’s name, so formats will be named accordingly per OS. Payloads will be unaffected/unmodified between different OS’s.

On Windows and Linux, generation of clipboard formats dynamically risks exhaustion of the atom pool. On Windows, there is room for around [16,000 registered window messages and clipboard formats](https://devblogs.microsoft.com/oldnewthing/20150319-00/?p=44433). Once those are exhausted, things will start behaving erratically because window classes use the same pool of atoms as clipboard formats. Applications will not be able to register window classes until the user logs off and back on. Linux has a limitation on the atom space as well, so an approach to overcome these limitations needs to be devised.

To avoid exhausting the atom pool, we will limit each user session to 100 custom formats. These custom formats will be registered when the web authors request a custom format. A site can use up to 100 custom formats at a time for copy/paste scenarios. They will be accompanied by a custom format metadata payload which will have a mapping of custom format MIME type to web custom format in JSON. Since this format is allocated in the global atom space on Windows, even if the sites register it multiple times, the format strings will only be allocated once and `RegisterClipboardFormat` system function call will just return the unique value corresponding to that format.

On the Mac, there is no limit to the number of clipboard formats that can be in use, nor are they required to be registered in advance. However, clipboard format types are named in a reverse-DNS scheme that only allows for alphanumeric characters and limited punctuation. Given that MIME types allow a large range of punctuation, and therefore would need to be mapped down to what is allowed for the clipboard, the clipboard mapping scheme used on Windows and Linux is also used on the Mac for consistency.

Native apps will need to read the web custom format map. They need to parse its payload as an alternative to `EnumFormats` on Windows to fetch the mapping of the custom MIME type to web custom format. It can then request for the web custom format corresponding to a particular MIME type of interest. When compared to alternatives that combine metadata and the actual payload into the same clipboard representation, the proposed separate metadata approach has advantages for [Delayed Rendering](https://docs.microsoft.com/en-us/windows/win32/dataxchg/clipboard-operations#delayed-rendering) of formats on Windows.  [Delayed Rendering](https://docs.microsoft.com/en-us/windows/win32/dataxchg/clipboard-operations#delayed-rendering) provides a way for the native app to indicate to the clipboard that a format is available, without rendering the content synchronously. When this format is requested by some other app, it renders the content on-demand.

The web custom format map will have the below naming convention per platform:

On Windows it will be inserted as `Web Custom Format Map`, on macOS `org.w3.web-custom-format.map` & On Linux/Android/CrOS etc `application/web;type="custom/formatmap"`.
The payload in this format map will be of type JSON with the key representing the MIME type and the web custom format as the value.
e.g. The web custom format map will have the below payload
#### On Windows
```
{

  "text/html" : "Web Custom Format0",
  "text/plain" : "Web Custom Format1",
  "text/csv" : "Web Custom Format2"
}
```

#### On macOS
```
{

  "text/html" : "org.w3.web-custom-format.type-0",
  "text/plain" : "org.w3.web-custom-format.type-1",
  "text/csv" : "org.w3.web-custom-format.type-2"
}
```

#### On Linux, ChromeOS, and Android
```
{

  "text/html" : "application/web;type="custom/format0",
  "text/plain" : "application/web;type="custom/format1",
  "text/csv" : "application/web;type="custom/format2"
}
```

The value in the JSON payload mentioned above contains the actual payload of the custom MIME type. It will be serialized in terms of raw bytes and will have the below formatting naming convention:

On macOS (and iOS), clipboard formats are named using the UTType reverse-DNS naming convention. Therefore, a MIME type `"text/html"` will be transformed to `"org.w3.web-custom-format.type-0"`.

On Windows, clipboard formats are often named using capital words separated by a space. Therefore, a MIME type `"text/html"` will be transformed to `"Web Custom Format0`.

On Linux, ChromeOS, and Android, MIME types are often used (though Linux and ChromeOS don’t have strong recommendations regarding clipboard format naming conventions). Therefore, a MIME type `"text/html"` will be transformed to `"application/web;type="custom/format0""`.

On Test and Headless platforms, MIME types will be used for consistency with Linux, ChromeOS, and Android.

## Considered alternatives

### Alternative Considered: unsanitized:list of well known MIME types.
If a site is reading `"text/html"` on the assumption that it returns a sanitized fragment which the site can then insert directly into the DOM, then this option would be helpful to give the authors the ability to pick either the sanitized fragment (from `"text/html"`) or the web custom format(from the web custom format map), but not both. The unsanitized option will only contain the list of mandatory formats supported by the browser. If a format is in the unsanitized list, then it doesn't go through the sanitization process in the browser.

From a backward compatibility point of view, this option is better than the proposed custom format read/write approach as it requires the web authors to explicitly opt into the unsanitized version of the mandatory formats that are currently supported by the browser. However, this option has some issues as listed below:
1. Creates interop differences between various browsers that don't want to support the unsanitized option. 
2. Not aligned with the current DataTransfer APIs where the read/write always returns unsanitized content regardless of the formats being read/written by the author. More details about interop differences between DataTransfer APIs and async APIs are present [here](https://docs.google.com/document/d/1rTEg2I-hMPXGiLrEMqKJz2Ycu6GRjlM3uvakOe84m8Q/edit?usp=sharing).
3. Can't build a clipboard viewer app that could enumerate all the formats in custom format map and the well-known types.
4. Web authors don't have the flexibility to access both well-known format and their corresponding custom format. This will have backward compat concerns for TinyMCE and sites that have special logic for old Office versions to use custom office attributes, image urls (then they read RTF to fetch the image) etc. Perhaps browsers can add some additional logic to add the standard HTML format to the custom format map so when the web authors specify the `"web text/html"`, it returns the unsanitized version read from the standard HTML format on the clipboard. This complicates the code and creates maintenance headaches. 

This option is certainly viable, but there are sites like Excel Online that rely on browsers to not strip out useful content from the HTML payload. The browser sanitizer returns a fragment and inlines the styles that bloats the payload, and strips out custom styles inserted by sites like Excel online that are used to preserve excel specific semantics. Thus, it'd be beneficial for the web authors if async clipboard and setData/getData APIs provide the same fidelity of HTML content.
An example of this approach is shown below:

```js
// web custom format read example. ClipboardItems returned by clipboard.read() may
// contain web custom format formats.
const clipboardItems = await navigator.clipboard.read({unsanitized: ['text/html', 'text/plain']});
const clipboardItem = clipboardItems[0];

const types = clipboardItem.types;
if (types.includes("web text/html")) {
  // There is a web custom format version of the standard HTML format that is fetched from the custom format map.
  // Process it here...
  const htmlBlob = await clipboardItem.getType('web text/html');
} else if (types.includes("text/html")) {
  // Process the payload fetched from the standard HTML format...
  const htmlBlob = await clipboardItem.getType('text/html');
} else if (types.includes("web text/custom")) {
  // This format reads as a web custom format format, only if it is available in the custom format map.
  const customTextBlob = await clipboardItem.getType('web text/custom');
}

```

```js
// web custom format write example.
// This format 'text/html' is recognized by the Clipboard API, so will be
// written to the standard HTML format and a web custom format version ("web text/html")
// added to the web custom format map. 
const textInput = '<html><head><style>color:blue</style><head><body><p>Hello</p></body></html>';
const htmlBlobInput = new Blob([textInput], {type: 'text/html'});
// This format 'text/custom' is not sanitized by the Clipboard API. It will be
// web custom format if the format is specified in the {unsanitized: []} formats list.
const customText = new Blob(
  ['<custom_markup>pickled_text</custom_markup>'], {type: 'web text/custom'});

// Clipboard format ordering: web custom formats will be written before sanitized
// formats by the browser, since they're more "custom" and likely more targeted
// towards this use case.
const clipboardItem = new ClipboardItem({
 'text/html': htmlBlobInput, /* Sanitized format. */
 'web text/custom': customText /* web custom format. This new format will be accepted
                            and written without rejection, as long as the new
                            unsanitized list contains this format. */
},
{unsanitized: ['text/html']} /* This new list specifies the web custom format for
                             'text/html'. */
);
navigator.clipboard.write([clipboardItem]);

```

### Alternative Considered: unsanitized:true.
Instead of providing a long list of formats, which requires repeating formats sites would like to be unsanitized, sites could simply offer a `unsanitized: true` flag, and read or write all formats not supported by the Async Clipboard API as web custom format formats. This would be a `ClipboardItemOption`, like `allowWithoutGesture`.

That said, this would make it impossible to specify which `ClipboardItem`s should be unsanitized. When writing a `{unsanitized: true}` ClipboardItem, a site would have to write all sanitized payloads with their web custom format equivalents, even if they only intended to use one unsanitized format, resulting in much longer time to write. Similarly, when reading, this would mean that all ClipboardItems must have all formats be unsanitized or not.

### Alternative Considered: unsanitized if not supported by the Async Clipboard API.
A much simpler approach would be to simply omit any `unsanitized` `ClipboardItemOption` at all, and simply read or write a web custom format whenever the Async Clipboard API doesn’t already support a sanitized version of the format. This has the same caveats as `unsanitized:true`, as it operates like `unsanitized:true` always being applied. In addition, it makes it difficult to apply a user gesture requirement for unsanitized clipboard, as it would be awkward and unclear for this requirement to be only active when a web custom format is requested, and not when only sanitized formats are requested.

## Risks
Web custom formats proposal consists of the below parts:

1. Shape of the API to read/write web custom format data.
2. Format of web custom format data on the native clipboard.

For #1 we need to update all browsers and convince web developers to migrate to the new API.
For #2 we need to update all browsers and native apps to consume this new custom format. This has backward compatibility concern, but since this is an explicit opt-in and doesn't affect reading/writing of the standard formats such as HTML, plain-text etc if these formats are written along with custom formats, we don't expect any copy-paste regressions for the existing formats.

## Privacy and Security
This feature introduces custom clipboard formats with unsanitized content that will be exposed to both native apps and websites. Through the custom clipboard formats, PII may be transferable from web to native apps or vice versa. Currently copy-paste operation (e.g. plain text payloads) does expose highly sensitive PII such as SSN, DOB, passwords etc. and this feature doesn't expose anything new. These custom formats may be less visible to the user compared to the plain-text format so it might still be possible to transfer PII data without the knowledge of the user.

Websites or native apps need to explicitly opt-in to consume these formats which will mitigate the concerns about remote code execution in legacy apps. Popular standardized data types (HTML, text, image etc) are available across all platforms and some types have sanitizers (HTML format) to strip out `<script>` and `comment` tags and decoders(for image formats), but for custom formats the content is unsanitized and could open up (by-design) a whole new world of attacks related to data types. This feature adds a [user gesture requirement](https://github.com/dway123/clipboard-pickling/blob/main/explainer.md#user-gesture-requirement) on top of [existing](https://github.com/dway123/clipboard-pickling/blob/main/explainer.md#permissions) async clipboard API security measures to mitigate security and privacy concerns.

For more details see the [security-privacy](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/ClipboardPickle/tag-security-privacy.md) doc.

### User Gesture Requirement
On top of Async Clipboard API requirements for focus, secure context, and permission, use of this API will require a [transient user activation](https://html.spec.whatwg.org/multipage/interaction.html#transient-activation), so that the site will not be able to silently read or write clipboard information.

This requirement is now enforced for the Async Clipboard API overall. It may be notable that Safari already requires a user gesture for all Async Clipboard API interactions.

### Permissions
Due to concerns regarding permission fatigue and comprehensibility, and due to the limited utility of a permission, no new permission would be implemented for unsanitized clipboard. Given that Clipboard API read and write are already permitted, unsanitized clipboard read and write will be permitted as is.

## Stakeholder Feedback / Opposition
*   Implementers:
    *   Edge : [Positive](https://crbug.com/106449#c19)
    *   Firefox : [Positive](https://github.com/mozilla/standards-positions/issues/525). [This](https://github.com/w3c/clipboard-apis/issues/165) is their proposal.
    *   Safari : [Request for position](https://lists.webkit.org/pipermail/webkit-dev/2021-May/031855.html)
*   Stakeholders:
    *   Figma : [Positive](https://crbug.com/150835#c73)
    *   Sketchup : [Positive](https://discourse.wicg.io/t/proposal-raw-clipboard-access/3979/4)

More discussion on this proposal: https://github.com/w3c/clipboard-apis/issues/165, 

## References & acknowledgements
Many thanks for valuable feedback and advice from:
*   jsbell@chromium.org
*   mek@chromium.org
*   pwnall@chromium.org
*   pcupp@microsoft.com
*   [annevk](https://github.com/annevk)

Reference Documents:
*   Raw Clipboard (a previous, related effort):
    *   [Explainer](https://github.com/WICG/raw-clipboard-access/blob/master/explainer.md)
    *   [Design document](https://tinyurl.com/raw-clipboard-access-design)
