# Build log

## Purpose and scope

Spatial Showroom explores how a product catalogue, a conversational assistant and an interactive 3D scene can support the same customer decision. The demonstration centres on a home office in a fixed 3.6 by 3.2 metre room, using ten original fictional products and illustrative CAD prices.

Martin selected the project scope and reviews the implementation and release evidence. AI tools assisted with implementation, documentation and validation work. This is an AI-assisted build with explicit human direction and review, not a claim that one person manually authored every component or independently originated every technical decision.

## Product decisions

The collection has three desks, three chairs, two lamps and two storage pieces. A desk and chair are required; the lamp and storage are optional. Shared wood finishes, upholstery, two layouts and two lighting modes provide visible variation without inventing products outside the catalogue.

The room uses real interactive Three.js geometry rendered through React Three Fiber. The furniture and materials are code-native originals. Selecting a scene object opens its catalogue controls. Manual adjustments, undo, reset and sharing remain useful when live AI is unavailable.

The visual identity uses charcoal, ivory, warm paper and the violet Webytex Agencies label. Product copy is English. The agency call to action points to the existing Webytex Agencies contact section. An original editorial cover is included in `public/social-preview.png` and its SVG source, with social-preview metadata configured for the site.

## Model boundary

The assistant interprets a short brief and proposes catalogue state. Code owns product IDs, dimensions, prices, totals and validation. The server supplies feasible product combinations alongside the current room and pinned choices, then validates the structured result independently.

Successful AI proposals must remain within budget, preserve pinned fields and pass the room checks. Manual edits can exceed the selected budget with a warning. Both manual and AI changes must satisfy the geometry checks. Pinning a chair also protects its fabric from AI changes; pins do not prevent direct user edits.

Every proposal carries a scene revision. Changes to the room, budget or pins invalidate pending work and prevent stale responses from replacing newer choices. Undo operates on snapshots of configuration, budget and pins.

## Sharing and operational boundaries

Share links encode a validated version, catalogue configuration and budget. A new visitor receives the room without the original brief or pins. Invalid versions, unknown choices, excessive payloads and geometry violations fail safely.

The optional live integration uses the OpenAI Responses API with `gpt-6.1-sol`, low reasoning effort, structured outputs and `store: false`. Server-only credentials, exact-origin checks, a signed visitor cookie, hosted BotID verification and atomic Redis admission protect the paid route. Admission reserves a conservative allowance before provider work. It does not refund that allowance after uncertain outcomes or retry provider requests automatically.

Provider configuration and provider billing remain separate from application counters. Private provider identifiers, credentials and approved spending limits are not release evidence for the public documentation.

## Verification record

The final local release checks recorded on 8 October 2026 include 75 passing offline tests in six files, a passing type check and a successful production build after the interface, sharing, layout-label and social-metadata adjustments. Browser observations cover catalogue totals, clearance rejection, undo, material and lighting changes, object selection, chair pinning, view controls and sharing with restoration of the room and budget. A mobile check found no horizontal overflow and confirmed the agency label and a visible clearance-rejection explanation. [Validation](VALIDATION.md) records the evidence and remaining checks in detail.

The source was published at [mspoli96-dev/spatial-showroom](https://github.com/mspoli96-dev/spatial-showroom), with initial release [`5109842`](https://github.com/mspoli96-dev/spatial-showroom/commit/51098427c4a3547edb8ae16b6986a0ad59d6541d) and a [passing GitHub Actions run](https://github.com/mspoli96-dev/spatial-showroom/actions/runs/37862801795). Release [`978f3ab`](https://github.com/mspoli96-dev/spatial-showroom/commit/978f3abd05d1a63eeec3ae1b377e5accd16796f4) raised the per-visitor allowance from five to ten daily attempts so visitors can iterate on a configuration. Other admission controls stayed unchanged, all 75 offline tests passed again, and its [GitHub Actions run passed](https://github.com/mspoli96-dev/spatial-showroom/actions/runs/37863694488). Vercel reported the release Ready at the [public demo](https://webytex-spatial-showroom.vercel.app).

Hosted interactions demonstrated material and lighting changes, a narrower desk with the chair and fabric preserved, and an unavailable result for an infeasible budget without changing the room. A manual upholstery edit cancelled an in-flight client request and remained present on a later UI-state inspection. The unseen response body is not evidence of a late model response being received and rejected. A further successful proposal after the allowance update preserved the selected products and pinned upholstery. The browser console showed no errors and one known upstream Three.js deprecation warning.

Final public-route probes confirmed the enabled configuration and signed cookie, a 403 rejection without BotID proof, 400 responses for invalid payloads and a WAF 429 on the fourth POST in the probe sequence. Those rejection probes did not reach the paid provider. Article and social drafts remain subject to their separate publication review.

## Deliberate limits

The demonstration has no room scans, uploaded photos, AR, checkout or voice interface. Its footprint rules are not architectural, ergonomic or physical-fit certification. It contains no client implementation, real customer records or claims of measured commercial lift. A client version would require its own catalogue integration, product assets, accessibility review, operational requirements and acceptance criteria.
