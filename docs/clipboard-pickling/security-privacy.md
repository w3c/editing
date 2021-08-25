
### Questions from https://www.w3.org/TR/security-privacy-questionnaire/

## 2. Questions to Consider
In general, note that secure contexts, focused frames, user gesture and user permissions are always required to access this feature, and serve as a level of safety.

### 2.1. What information might this feature expose to Web sites or other parties, and for what purposes is that exposure necessary?

Pickling will expose the contents of new, web-originated formats to the platform clipboard and sites, without sanitization. This exposure is necessary to allow web applications to support new clipboard formats, and to allow different browsers or native applications to eventually interoperate with these formats as well. Existing native formats will \*not\* be exposed, to protect legacy native applications from exposure to malicious clipboard content. The status quo is that sites can simulate these advanced formats via downloading/uploading files, or serializing such information into a clipboard’s text/plain field. Alternatively, sites often also use extensions or non-standardized APIs to achieve this goal. Pickling will provide a new, more streamlined way for web applications to transfer information between themselves and one another.

### 2.2. Is this specification exposing the minimum amount of information necessary to power the feature?
Yes, this information is necessary for web applications to effectively transfer new, non-standardized types between one another.

### 2.3. How does this specification deal with personal information or personally-identifiable information or information derived thereof?
PII may be transferred by sites using these new formats, just like they could be (and are) transferred using existing formats (ex. Passwords and addresses are commonly transferred on the clipboard). That said, pickling introduces new formats that may not be commonly pasted, so it may be less clear to users when pickled information that may contain PII is added to the clipboard.

### 2.4. How does this specification deal with sensitive information?
Concerns and mitigations regarding sensitive information are the same as with PII.

### 2.5. Does this specification introduce new state for an origin that persists across browsing sessions?
Pickling exposes more state for an origin persisting across browsing sessions, in that new clipboard formats will be exposed. This is [partially mitigated](https://www.w3.org/TR/security-privacy-questionnaire/#example-7ac55a84:~:text=User%20agents%20mitigate%20the%20risk%20that,contained%20in%20these%20types%20of%20storage.) by allowing users the option to clear their previous clipboard, by copying a different payload, or completely clear their clipboard by copying empty contents, like with the existing clipboard implementation.

### 2.6. What information from the underlying platform, e.g. configuration data, is exposed by this specification to an origin?
Native applications updated to support pickling may write clipboard data and formats, on the underlying platform, that would be exposed by this specification to an origin. This makes active fingerprinting possible. Passive fingerprinting is disallowed due to permission and user gesture requirements.

From clipboard data, it could be possible to infer the previous updated native application that copied on the clipboard, and even potentially the version of this native application (ex. if the native application previously supplied 0 pickled formats, and now supports 1).

This should not be much information, so should be relatively safe, but in combination with other fingerprinting vectors, could allow a site to fingerprint a user with more precision. This information is consistent across origins.

### 2.7. Does this specification allow an origin access to sensors on a user’s device
No.

### 2.8. What data does this specification expose to an origin? Please also document what data is identical to data exposed by other features, in the same or different contexts.
See section 2.1 for data exposed to an origin. For data identical to data exposed by other features:

Pickling data is roughly identical to existing clipboard data in when it will be exposed, barring that pickling also requires user gesture, and what it exposes, barring that pickling can expose new formats created by sites.

### 2.9. Does this specification enable new script execution/loading mechanisms?
It is possible for new scripts to be loaded, as this clipboard information could contain formats that sites choose to interpret as a script. This is no different from the status quo, where users may paste text/plain code (example: ``sudo rm -rf \``) into a terminal or editor and execute it.

A concern regarding script execution is that pickled formats are less transparent, as not all sites will support all formats. Therefore, users may unknowingly paste pickled formats hiding executable code, which will be less obvious than the example of users pasting this in a terminal.

### 2.10. Does this specification allow an origin to access other devices?
No.

### 2.11. Does this specification allow an origin some measure of control over a user agent’s native UI?
No.

### 2.12. What temporary identifiers might this specification create or expose to the web?
None.

### 2.13. How does this specification distinguish between behavior in first-party and third-party contexts?
Like with the underlying Async Clipboard API, implementers may choose to only allow this API in third-parties if feature policy is applied.

### 2.14. How does this specification work in the context of a user agent’s Private \ Browsing or "incognito" mode?
There is no variation for private or incognito modes.

### 2.15. Does this specification have a "Security Considerations" and "Privacy Considerations" section?
Yes. Security Considerations are [here](https://www.w3.org/TR/clipboard-apis/#security), and Privacy Considerations are [here](https://www.w3.org/TR/clipboard-apis/#privacy).

### 2.16. Does this specification allow downgrading default security characteristics?
No.

### 2.17. What should this questionnaire have asked?
#### 2.17.1. How might this specification compromise a user's system?
For historical reasons, it should be noted that pickling \*cannot\* compromise a user’s existing system, as formats proposed by pickling are \*not\* interoperable with existing clipboard formats, and originate from the web. Native applications therefore must opt-in to use these formats, with the knowledge that these formats originate from the web.

For context, a related, [previous proposal](https://github.com/WICG/raw-clipboard-access/blob/master/explainer.md) did not have this guarantee, which meant that sites could in theory interoperate with and compromise a user’s existing system, unless implementers added additional protections.

## Threat Models
###  3.1. Passive Network Attackers
No new information visible to a passive network attacker is exposed by Pickling.

###  3.2. Active Network Attackers
An active network attacker would require active user gesture and an approved permission interaction, in order to gain read access to the clipboard’s contents, just like with the existing Clipboard API.

###  3.3. Same-Origin Policy Violations
This data isn’t associated with any origin, and is associated with the system instead. At minimum, a click into the other origin’s frame, secure context, and a previously granted permission is required to have another origin gain access to this data. This is no different from the existing Clipboard API.

###  3.4. Third-Party Tracking
This should not be affected by third-party tracking, unless a new clipboard type were to be used to attempt to track user behavior. However, this is already more possible and powerful to do through cookies. See 3.5 Legitimate Misuse for more information.

###  3.5. Legitimate Misuse
It is possible that a Web or Native application secretly sends information the user did not intend to expose, through a custom clipboard type that is not expected to be used. While it is already possible to transmit data a user may not intend to transmit via text/plain and other standardized types, or via steganography in an image, this would provide yet another avenue to hide information on a platform clipboard.
