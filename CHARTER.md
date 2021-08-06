## This is the old Editing Task Force Charter.

**The current Editing Working Group Charter is here: https://www.w3.org/2021/06/web-editing-wg-charter.html**

---

**Confidentiality:** Proceedings are [public](https://www.w3.org/2005/10/Process-20051014/comm.html#confidentiality-levels)

**Chairs (acting as delegates from the WebApps WG chairs):** Johannes Wilm (Invited Expert), Grisha Lyukshin (Microsoft)

**Meeting Schedules:** Teleconferences: On an as-needed basis. Preferably, a minimum of one status meeting per month. Face-to-face meetings: On an as-needed basis. Video Conferences: On an as-needed basis.

### Abstract

Enabling rich editing experience on the web is currently a challenging task. Reasons are many. For example, lack of requirements in the behavior of the `contenteditable` attribute in HTML, currently, the only browser primitive providing rich editing surface to web developers. Also, lack of support for low level editing APIs that would allow web developers to build rich editing experiences without getting browsers interference in this process.

Editing Task Force sets out to explore limitations in existing browser primitives, provide use cases for new APIs and suggest solutions either by standardizing of existing behaviors or introducing new APIs. The goal is to facilitate the creation of fully-featured editing systems as well as small editors using JavaScript.

The Task Force (TF) is part of the [W3C WebApps Working Group](https://w3c.github.io/webappswg/). The TF works primarily within its editing community on [Github](https://github.com/w3c/editing) and will report the results of its activities back to [W3C WebApps Working Group](https://www.w3.org/2019/webapps/).

TF is leveraging the existing editing [GitHub](https://github.com/w3c/editing) repo with well-known locations and history of discussions on a variety of editing-related topics in order to “incubate” new editing-specific standards.

This charter is intended to reflect on the current direction of the TF group, so that there is common agreement. It may be altered at any point in order to reflect new priorities or work items.

### 1. Scope

The scope of Editing TF covers multiple aspects of editing, which may include:

- Textual input and text manipulation
- Text editing related events
- Selection
- Clipboard
- Spellcheck and grammar checking
- Reusing or discarding parts of or entire pre-existing editing APIs to serve as primitives of editing systems
- Standardization of under-specified existing editing related features
- Highlighting parts of text ranges without inducing DOM mutations.

Experts who are contributing members of the task force will contribute to documents produced by the group, as described in the section on deliverables below.

### 2. Deliverables

This Task Force will:

- ensure that browsers are developing APIs that meet the expectations of editing framework authors of varying skill and team sizes.
- allow a network of experts to share information about gaps and requirements for building editing frameworks on the web.

The specifications the Editing Taskforce is producing may be driven to the spec level directly by its members within the Web Applications Working Group, or be transferred to another, more appropriate working group after initial collection of requirements. Furthermore, the group defines its success as when it at the very least, produces a recommendation with well defined requirements that result in enhancing existing text editing related specification drafts or helps design new ones.

The TF is expected to work on the following efforts until the end of the charter but it is not meant to be an exhaustive list:

- [Async Clipboard API](https://bugs.chromium.org/p/chromium/issues/detail?id=931839)
- [ContentEditableDisabled](http://w3c.github.io/editing/docs/contentEditableDisabled/) - ability to disable system UI
- [EditContext API](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/master/EditContext/explainer.md)
- [Highlight API](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/master/highlight/explainer.md)
- Native Selection and Caret behaviors
- [SpellChecker API](https://github.com/w3c/editing/issues/166)
- [SIP Policy](https://github.com/whatwg/html/issues/4876)
- [Input Events](https://www.w3.org/TR/input-events-1/)
- [ContentEditable](https://w3c.github.io/contentEditable/)

Deliverables are expected to eventually be shipped as Recommendations by the Web Applications Working Group, CSS Working Group or any other group where a draft specification may fall into.

### 3. Participation

This task force is designed to make participation relatively easy for people not currently involved in the standards process (typically, developers of editing tool libraries) who may not be amenable to signing up to a large in scope discussions that can be found in, for instance, the main Web Applications Working Group.

**As per W3C IPR requirements, if a participant plans on making more than light editorial changes or propose new approaches and APIs, TF chairs will need to be notified and nominate you to become an [Invited Expert](https://www.w3.org/participate/invited-experts/).**

The group encourages questions, comments and all technical discussions on its public [mailing list](https://lists.w3.org/Archives/Public/public-editing-tf/) and [document repositories](https://github.com/w3c/editing).

Participants are reminded of the [W3C's Code of Ethical Conduct](https://www.w3.org/Consortium/cepc/).

### 4. Decision Policy

The Editing Task force operates under the WebApps Working Group's [decision policy](https://www.w3.org/2019/05/webapps-charter.html#decisions) and adheres to the WebApps WG [working mode](https://www.w3.org/2019/05/webapps-charter.html#working-mode).
