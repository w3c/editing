# Pickling for Async Clipboard API


## Author:
*   huangdarwin@chromium.org

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
const image = await fetch('myImage.png');
const text = new Blob(['this is an image'], {type: 'text/plain'});
const clipboard_item = new ClipboardItem({'text/plain': text, 'image/png': image});
await navigator.clipboard.write([clipboard_item]);
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
1. Is included in a `{direct: ['format1', 'format2']}` list of formats for the `ClipboardItem`’s `ClipboardItemOption`. 
2. Regardless of whether a sanitized format is also written.

For example, writing the format `"text/plain"`, which is recognized by the Clipboard API as a sanitized format, will write this format to the clipboard as usual. On the other hand, writing a format `"text/custom-format"`, while also providing a `{direct: ['text/custom-format']}` list will result in a pickled format corresponding to `"text/custom-format"` to be written to the clipboard. And writing “text/plain” with a `{direct: ['text/plain']}` list will write both a sanitized and pickled payload. This API change allows a potential related pickling and sanitized format to coexist on the clipboard at the same time, which allows sites to interoperate with the more widely used sanitized format, while also getting the increased fidelity of the unmodified pickled format.

```js
// Pickling write example.
// This format 'text/plain' is recognized by the Clipboard API, so will be
// written as usual.
const text = new Blob(['text'], {type: 'text/plain'});
// This format 'text/custom' is not sanitized by the Clipboard API. It will be
// pickled if the format is specified in the {direct: []} formats list.
const customText = new Blob(
  ['<custom_markup>pickled_text</custom_markup>'], {type: 'text/custom'});

// Clipboard format ordering: Pickled formats will be written before sanitized
// formats by the browser, since they're more "custom" and likely more targeted
// towards this use case.
const clipboardItem = new ClipboardItem({
  'text/plain': text,       /* Sanitized format. */
  'text/custom': customText /* Pickled format. This new format will be accepted
                            and written without rejection, as long as the new
                            direct list contains this format. */
}, 
{direct: ['text/custom']} /* This new list specifies the pickled format
                          'text/custom'. */
);
navigator.clipboard.write([clipboard_item]);
```

## Pickling Read
Pickled formats will be read and placed in the relevant `ClipboardItem`, instead of sanitized formats, when the site tries to use a format that:
1. Is included in a `{direct: ['format1', 'format2']}` list of formats for the overall read() call.
2. This will be preferred over a sanitized payload available on the same clipboard.

```js
// Pickling read example. ClipboardItems returned by clipboard.read() may 
// contain pickled formats.
const clipboardItems = await navigator.clipboard.read(
    {direct: ['text/custom']} /* This new list specifies the pickled format
                              'text/custom' for all read ClipboardItems. */
  );
const clipboardItem = clipboardItems[0];

const textBlob = await clipboardItem.getType('text/plain');
// This format reads as a pickled format, only if it is included in the direct
// format list.
const customTextBlob = await clipboardItem.getType('text/custom');
```

## Detailed design discussion

### Pickled version for sanitized formats
Sanitization of clipboard formats, while important for security reasons, may impair correctness and completeness of a clipboard format, by removing potentially useful information in a clipboard format. For HTML, <script>s  may be stripped, and in JPG, metadata like orientation or GPS location may be stripped. 

Sites can read or write pickled versions of sanitized formats, by providing the format in the `{direct: []}` list. This should be done sparingly, only where sites are concerned about metadata scrubbed by sanitization. This is because on write, this would require another payload to be written, which could be slow for large payloads. Similarly, on read, pickled data is not guaranteed to be secure or protected by the sanitization process.

### OS-Interaction: Format Naming
Native applications will only be able to interact with these formats if they explicitly add support for these pickled formats. Different platforms / OS’s often have different conventions for a clipboard format’s name, so formats will be named accordingly per OS. Payloads will be unaffected/unmodified between different OS’s.

On MacOS (and iOS), clipboard formats are named using the UTI reverse-DNS naming convention. Therefore, a MIME type `"custom/format"` will be transformed to `"com.web.custom.format"`. Note that the pickling prefix `"com.web"` precedes the transformed format name `"custom.format"`, and the slash is converted to a period.

On Windows, clipboard formats are often named using capital words separated by a space. Therefore, a MIME type `"custom/format"` will be transformed to `"Web Custom Format`”. Note that the prefix `"Web"` precedes the transformed format name.

On Linux, ChromeOS, and Android, MIME types are often used (though Linux and ChromeOS don’t have strong recommendations regarding clipboard format naming conventions). Therefore, a MIME type `"custom/format"` will be transformed to `"application/web;type="custom/format""`. Note that the pickling prefix `"application/web;type="` precedes the transformed format name, which has quotes around the format name.

On Test and Headless platforms, MIME types will be used for consistency with Linux, ChromeOS, and Android.

### User Gesture Requirement
On top of Async Clipboard API requirements for focus, secure context, and permission, use of this API will require a user gesture, so that the site will not be able to silently read or write clipboard information. This will be gated when the `{direct: ['format1', 'format2']}` list is present, and will reject if the user gesture is not present.

This requirement isn’t enforced for the Async Clipboard API overall, as such a change would be web-incompatible, breaking sites that already use this API with the expectation that user gesture was not a requirement. That said, as direct clipboard would be a new, more powerful API, it will be required to protect the user’s privacy. Additionally, it may be notable that Safari already requires a user gesture for all Async Clipboard API interactions.

### Permissions
Due to concerns regarding permission fatigue and comprehensibility, and due to the limited utility of a permission, no new permission would be implemented for direct clipboard. Given that Clipboard API read and write are already permitted, direct clipboard read and write will be permitted as is.

### Caveat: Unclear Clipboard format source on read.
A site may potentially read a format from one of two roughly equivalent sources: sanitized or pickled. It may be unclear or confusing which equivalent format is actually being read from. This could allow malicious sites to for example write a malicious pickled text/plain format, while also providing an innocuous sanitized text/plain format. Most folks will only ever see the innocuous content, but folks using a site that expects pickled content may surprisingly be exposed to the malicious content. It could also be confusing for sites that a native application expecting a sanitized format cannot get access to the same content as another native application expecting the equivalent pickled format.

## Considered alternatives

### Alternative Considered: direct:true.
Instead of providing a long list of formats, which requires repeating formats sites would like to be direct, sites could simply offer a `direct: true` flag, and read or write all formats not supported by the Async Clipboard API as pickled formats. This would be a `ClipboardItemOption`, like `allowWithoutGesture`.

That said, this would make it impossible to specify which `ClipboardItem`s should be direct. When writing a `{direct: true}` ClipboardItem, a site would have to write all sanitized payloads with their pickled equivalents, even if they only intended to use one direct format, resulting in much longer time to write. Similarly, when reading, this would mean that all ClipboardItems must have all formats be direct or not.

### Alternative Considered: direct if not supported by the Async Clipboard API.
A much simpler approach would be to simply omit any `direct` `ClipboardItemOption` at all, and simply read or write a pickled format whenever the Async Clipboard API doesn’t already support a sanitized version of the format. This has the same caveats as `direct:true`, as it operates like `direct:true` always being applied. In addition, it makes it difficult to apply a user gesture requirement for direct clipboard, as it would be awkward and unclear for this requirement to be only active when a pickled format is requested, and not when only sanitized formats are requested.

## Stakeholder Feedback / Opposition
*   Implementers:
    *   Edge : No Signals
    *   Firefox : No Signals
    *   Safari : No Signals
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
