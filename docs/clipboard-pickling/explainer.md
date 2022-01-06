# Pickling for Async Clipboard API


## Author:
*   huangdarwin@chromium.org
*   snianu@microsoft.com

## Introduction
Powerful web applications would like to exchange data payloads with web and native applications via the OS clipboard (copy-paste). The existing Web Platform has an API that supports the most popular standardized data types (text, image, rich text) across all platforms. However, this API does not scale to the long tail of specialized formats. In particular, custom formats, non-web-standard formats like TIFF (a large image format), and proprietary formats like .docx (a document format), are not supported by the current Web Platform. Pickling for Async Clipboard API aims to provide a solution to this problem, by letting web applications read and write custom, unsanitized, web-originated payloads using a standardized pickling format.

Pickling could be used by:
*   Web Apps to support popular but not-web-standardized formats like GIFs, like [Figma](https://crbug.com/150835#c73) or Photopea.
*   Web Apps to support application-specific types, for example to copy and paste within or between Google Docs and Google Sheets, (or Office 365’s Word and Excel products) using pickled formats.
*   Developers owning both a web and native application, like SketchUp, to communicate between their applications.

The existing Async Clipboard API’s re-encoding is still encouraged for use cases requiring only generic types, and easier to use as they are standardized and widely-interoperable, but pickling allows web applications with more specific or sophisticated clipboard needs to meet those needs.

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
*   Modify design of original Async Clipboard API, where not relevant to pickling.
*   Anything not related to Async Clipboard API, including the DataTransfer API or Drag-and-Drop. Pickling as described in this explainer should be extensible to also work for Drag-and-Drop, but this explainer's scope is limited to clipboard.

## Additional Background
This design aims to allow access to custom, web-originated formats. This is referred to as Pickling, because this is [historically](https://bugzilla.mozilla.org/show_bug.cgi?id=860857) what web platform engineers have [referred to this idea as](https://github.com/w3ctag/design-reviews/issues/406#issuecomment-542310250). This name likely originates from a [Python serialization structure](https://docs.python.org/3/library/pickle.html) of the same name, as WebKit and Blink both offer unstandardized (and minimally documented) implementations of custom formats via similar implementations involving serialized structures. This proposal aims not only to add this support to the Async Clipboard API, but also to standardize such behavior, opening up related unstandardized DataTransfer implementations to become standardized in the future.

## Existing Async Clipboard API read and write
The existing [Async Clipboard API](https://w3c.github.io/clipboard-apis/#async-clipboard-api) already provides for reading or writing multiple sanitized items from or to the clipboard.

Existing Async Clipboard API write call:
```js
const image = await fetch('myImage.png').then(response => response.blob());
const text = new Blob(['this is an image'], {type: 'text/plain'});
const clipboardItem = new ClipboardItem({'text/plain': text, 'image/png': image});
await navigator.clipboard.write([clipboardItem]);
```

Existing Async Clipboard API read call:
```js
const clipboardItems = await navigator.clipboard.read();
const clipboardItem = clipboardItems[0];
const text = await clipboardItem.getType('text/plain');
const image = await clipboardItem.getType('image/png');
```

## Pickling Write
Pickled formats will be written when the site tries to use a format that:
1. Is included in a `{unsanitized: ['format1', 'format2']}` list of formats for the `ClipboardItem`’s `ClipboardItemOption`.
2. Regardless of whether a sanitized format is also written.

For example, writing the format `"text/plain"`, which is recognized by the Clipboard API as a sanitized format, will write this format to the clipboard as usual. On the other hand, writing a format `"text/custom-format"` with a `{unsanitize: ['text/custom-format']}` list, which is not recognized by the Clipboard API as a sanitized format, will result in a pickled format corresponding to `"text/custom-format"` to be written to the clipboard. And writing `"text/plain"` with a `{unsanitized: ['text/plain']}` list will write both a sanitized and pickled payload. This API change allows a potential related pickling and sanitized format to coexist on the clipboard at the same time, which allows sites to interoperate with the more widely used sanitized format, while also getting the increased fidelity of the unmodified pickled format.

```js
// Pickling write example.
// This format 'text/plain' is recognized by the Clipboard API, so will be
// written as usual.
const text = new Blob(['text'], {type: 'text/plain'});
// This format 'text/custom' is not sanitized by the Clipboard API. It will be
// pickled if the format is specified in the {unsanitized: []} formats list.
const customText = new Blob(
  ['<custom_markup>pickled_text</custom_markup>'], {type: 'text/custom'});

// Clipboard format ordering: Pickled formats will be written before sanitized
// formats by the browser, since they're more "custom" and likely more targeted
// towards this use case.
const clipboardItem = new ClipboardItem({
  'text/plain': text,       /* Sanitized format. */
  'text/custom': customText /* Pickled format. This new format will be accepted
                            and written without rejection, as long as the new
                            unsanitized list contains this format. */
}, 
{unsanitized: ['text/custom']} /* This new list specifies the pickled format
                          'text/custom'. */
);
navigator.clipboard.write([clipboardItem]);
```

## Pickling Read
Pickled formats will be read and placed in the relevant `ClipboardItem`, instead of sanitized formats, when the site tries to use a format that:
1. Is included in a `{unsanitized: ['format1', 'format2']}` list of formats for the overall read() call.
2. This will be preferred over a sanitized payload available on the same clipboard.

```js
// Pickling read example. ClipboardItems returned by clipboard.read() may 
// contain pickled formats.
const clipboardItems = await navigator.clipboard.read(
    {unsanitized: ['text/custom']} /* This new list specifies the pickled format
                              'text/custom' for all read ClipboardItems. */
  );
const clipboardItem = clipboardItems[0];

const textBlob = await clipboardItem.getType('text/plain');
// This format reads as a pickled format, only if it is included in the unsanitized
// format list.
const customTextBlob = await clipboardItem.getType('text/custom');
```

## Detailed design discussion

### Pickled version for sanitized formats
Sanitization of clipboard formats, while important for security reasons, may impair correctness and completeness of a clipboard format, by removing potentially useful information in a clipboard format. For HTML, `<script>`s  may be stripped, and in JPG, metadata like orientation or GPS location may be stripped.

Sites can read or write pickled versions of sanitized formats, by providing the format in the `{unsanitized: []}` list. This should be done sparingly, only where sites are concerned about metadata scrubbed by sanitization. This is because on write, this would require another payload to be written, which could be slow for large payloads. Similarly, on read, pickled data is not guaranteed to be secure or protected by the sanitization process.

### OS-Interaction: Format Naming
Native applications will only be able to interact with these formats if they explicitly add support for these pickled formats. Different platforms / OS’s often have different conventions for a clipboard format’s name, so formats will be named accordingly per OS. Payloads will be unaffected/unmodified between different OS’s.

On Windows & Linux, generation of clipboard formats dynamically risks exhaustion of the atom pool. On Windows, there is room for around [16,000 registered window messages and clipboard formats](https://devblogs.microsoft.com/oldnewthing/20150319-00/?p=44433). Once those are exhausted, things will start behaving erratically because window classes use the same pool of atoms as clipboard formats. Applications will not be able to register window classes until the user logs off and back on. Linux has a limitation on the atom space as well so a new approach for custom format naming and payload serialization/deserialization format will be used. This approach will be safer from a security perspective, and also deterministic as to how many custom formats are guaranteed to be available in the clipboard via pickling APIs.

To avoid exhausting the atom pool, we will limit each user session to 100 custom formats. These custom formats will be registered when the web authors request a custom format. A site can use up to 100 custom formats at a time for copy/paste scenarios. They will be accompanied by a custom format metadata payload which will have a mapping of custom format MIME type to web custom format in JSON format. Since this format is allocated in the global atom space on Windows, even if the sites register it multiple times, the format strings will only be allocated once and `RegisterClipboardFormat` system function call will just return the unique value corresponding to that format.

Native apps will need to read the web custom format map. They need to parse its payload as an alternative to `EnumFormats` on Windows to fetch the mapping of the custom MIME type to web custom format. It can then request for the web custom format corresponding to a particular MIME type of interest. This also helps in [Delayed Rendering](https://docs.microsoft.com/en-us/windows/win32/dataxchg/clipboard-operations#delayed-rendering) of formats on Windows.  [Delayed Rendering](https://docs.microsoft.com/en-us/windows/win32/dataxchg/clipboard-operations#delayed-rendering) provides a way for the native app to indicate to the clipboard that a format is available, without rendering the content synchronously. When this format is requested by some other app, it renders the content on-demand.

The web custom format map will have the below naming convention per platform:

On Windows it will be inserted as `Web Custom Format Map`, on MacOS `com.web.custom.format.map` & On Linux/Android/CrOS etc `application/web;type="custom/formatmap"`.
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

#### On MacOS
```
{

  "text/html" : "com.web.custom.format0",
  "text/plain" : "com.web.custom.format1",
  "text/csv" : "com.web.custom.format2"
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

On MacOS (and iOS), clipboard formats are named using the UTI reverse-DNS naming convention. Therefore, a MIME type `"text/html"` will be transformed to `"com.web.custom.format0"`. Note that the pickling prefix `"com.web"` precedes the transformed format name `"custom.format0"`.

On Windows, clipboard formats are often named using capital words separated by a space. Therefore, a MIME type `"text/html"` will be transformed to `"Web Custom Format0`.

On Linux, ChromeOS, and Android, MIME types are often used (though Linux and ChromeOS don’t have strong recommendations regarding clipboard format naming conventions). Therefore, a MIME type `"text/html"` will be transformed to `"application/web;type="custom/format0""`.

On Test and Headless platforms, MIME types will be used for consistency with Linux, ChromeOS, and Android.

### Caveat: Unclear Clipboard format source on read.
A site may potentially read a format from one of two roughly equivalent sources: sanitized or pickled. It may be unclear or confusing which equivalent format is actually being read from. This could allow malicious sites to for example write a malicious pickled text/plain format, while also providing an innocuous sanitized text/plain format. Most folks will only ever see the innocuous content, but folks using a site that expects pickled content may surprisingly be exposed to the malicious content. It could also be confusing for sites that a native application expecting a sanitized format cannot get access to the same content as another native application expecting the equivalent pickled format.

## Considered alternatives

### Alternative Considered: unsanitized:true.
Instead of providing a long list of formats, which requires repeating formats sites would like to be unsanitized, sites could simply offer a `unsanitized: true` flag, and read or write all formats not supported by the Async Clipboard API as pickled formats. This would be a `ClipboardItemOption`, like `allowWithoutGesture`.

That said, this would make it impossible to specify which `ClipboardItem`s should be unsanitized. When writing a `{unsanitized: true}` ClipboardItem, a site would have to write all sanitized payloads with their pickled equivalents, even if they only intended to use one unsanitized format, resulting in much longer time to write. Similarly, when reading, this would mean that all ClipboardItems must have all formats be unsanitized or not.

### Alternative Considered: unsanitized if not supported by the Async Clipboard API.
A much simpler approach would be to simply omit any `unsanitized` `ClipboardItemOption` at all, and simply read or write a pickled format whenever the Async Clipboard API doesn’t already support a sanitized version of the format. This has the same caveats as `unsanitized:true`, as it operates like `unsanitized:true` always being applied. In addition, it makes it difficult to apply a user gesture requirement for unsanitized clipboard, as it would be awkward and unclear for this requirement to be only active when a pickled format is requested, and not when only sanitized formats are requested.

## Risks
Pickling clipboard API proposal consists of the below parts:

1. Shape of the API to read/write pickled data.
2. Format of pickled data on the native clipboard.

For #1 we need to update all browsers and convince web developers to migrate to the new API.
For #2 we need to update all browsers and native apps to consume this new custom format. This has backward compatibility concern, but since this is an explicit opt-in and doesn't affect reading/writing of the standard formats such as HTML, plain-text etc if these formats are written along with custom formats, we don't expect any copy-paste regressions for the existing formats.

## Privacy and Security
This feature introduces custom clipboard formats with unsanitized content that will be exposed to both native apps and websites. Through the custom clipboard formats, PII may be transferable from web to native apps or vice versa. The content in the custom format may be less visible/obvious to the users compared to the plain-text format so it might still be possible to transfer PII data without the knowledge of the user. This is also true for the existing [DataTransfer APIs](https://html.spec.whatwg.org/multipage/dnd.html#the-datatransfer-interface) that expose unsanitized HTML content in the standard HTML format(via setData/getData methods), but there may be metadata present in the custom format that wouldn't be typically included in the HTML format. The parsing rules for the custom format content and what data is included in the format, have to be defined by the native and web apps that read/write this format, so that alleviates some privacy concerns regarding who can read the sensitive data (if present) in the custom formats.

Websites or native apps need to explicitly opt-in to consume these formats which would mitigate the concerns about remote code execution in legacy apps. Popular standardized data types (HTML, text, image etc) are available across all platforms and some types have sanitizers (HTML format) to strip out `<script>` and `comment` tags and decoders(for image formats), but for custom formats the content is unsanitized and could open up (by-design) a whole new world of attacks related to data types. This feature adds a [user gesture requirement](https://github.com/w3c/editing/blob/gh-pages/docs/clipboard-pickling/explainer.md#user-gesture-requirement) on top of [existing](https://github.com/w3c/editing/blob/gh-pages/docs/clipboard-pickling/explainer.md#permissions) async clipboard API security measures to mitigate security and privacy concerns.

For more details see the [security-privacy](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/ClipboardPickle/tag-security-privacy.md) doc.

### User Gesture Requirement
On top of Async Clipboard API requirements for focus, secure context, and permission, use of this API will require a [transient user activation](https://html.spec.whatwg.org/multipage/interaction.html#transient-activation), so that the site will not be able to silently read or write clipboard information. This will be gated when the `{unsanitized: ['format1', 'format2']}` list is present, and will reject if the user gesture is not present.

This requirement isn’t enforced for the Async Clipboard API overall, as such a change would be web-incompatible, breaking sites that already use this API with the expectation that user gesture was not a requirement. That said, as unsanitized clipboard would be a new, more powerful API, it will be required to protect the user’s privacy. Additionally, it may be notable that Safari already requires a user gesture for all Async Clipboard API interactions.

### Permissions
Due to concerns regarding permission fatigue and comprehensibility, and due to the limited utility of a permission, no new permission would be implemented for unsanitized clipboard. Given that Clipboard API read and write are already permitted, unsanitized clipboard read and write will be permitted as is.

## Stakeholder Feedback / Opposition
*   Implementers:
    *   Edge : [Positive](https://crbug.com/106449#c19)
    *   Firefox : [Request for position](https://github.com/mozilla/standards-positions/issues/525)
    *   Safari : [Request for position](https://lists.webkit.org/pipermail/webkit-dev/2021-May/031855.html)
*   Stakeholders:
    *   Figma : [Positive](https://crbug.com/150835#c73)
    *   Sketchup : [Positive](https://discourse.wicg.io/t/proposal-raw-clipboard-access/3979/4)

While engineers at [Firefox](https://github.com/mozilla/standards-positions/issues/206#issuecomment-552800558), [Safari](https://github.com/w3ctag/design-reviews/issues/406#issuecomment-567231414), and [Edge](https://github.com/mozilla/standards-positions/issues/206#issuecomment-542013313) have had positive feedback regarding exploring Pickling, no representatives of these implementers have commented on this particular proposal yet.

## References & acknowledgements
Many thanks for valuable feedback and advice from:
*   jsbell@chromium.org
*   mek@chromium.org
*   pwnall@chromium.org

Reference Documents:
*   Raw Clipboard (a previous, related effort):
    *   [Explainer](https://github.com/WICG/raw-clipboard-access/blob/master/explainer.md)
    *   [Design document](https://tinyurl.com/raw-clipboard-access-design)
*   [Direct Clipboard design document](https://docs.google.com/document/d/120n4JSFTw5i72TqdwHA0_had1B-y6o94SrEwmlJyry0/) (sorry, internal-only).
