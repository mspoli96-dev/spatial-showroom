# Validation

Status recorded on 8 October 2026. Local implementation, offline verification and hosted verification are separate evidence categories. A passing build does not establish that live proposals work in production.

## Automated local checks

The final local release checks passed after the interface, sharing, layout-label and social-metadata adjustments:

| Command | Result |
| --- | --- |
| `npm test` | 75 tests across six files passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed |

The public source is available at [mspoli96-dev/spatial-showroom](https://github.com/mspoli96-dev/spatial-showroom). The initial release [`5109842`](https://github.com/mspoli96-dev/spatial-showroom/commit/51098427c4a3547edb8ae16b6986a0ad59d6541d) passed [GitHub Actions run 37862801795](https://github.com/mspoli96-dev/spatial-showroom/actions/runs/37862801795). A scan of its 51 tracked files found no private values in the release scan's checks.

Release [`978f3ab`](https://github.com/mspoli96-dev/spatial-showroom/commit/978f3abd05d1a63eeec3ae1b377e5accd16796f4) raises the per-visitor daily allowance from five to ten attempts for iterative configuration. The shared daily, concurrency and spending controls are unchanged. All 75 offline tests passed again, and [GitHub Actions run 37863694488](https://github.com/mspoli96-dev/spatial-showroom/actions/runs/37863694488) passed for this release.

The six test files cover the catalogue, configuration and proposal contract; versioned share URLs; visitor identity and bounded requests; route admission; the provider boundary; and atomic Redis admission scripts.

Meaningful regression cases include unknown IDs and fields, integer-cent price calculation, exact budget boundaries, every available floor combination, desk-lamp containment, all pinned fields, over-budget proposals, inconsistent result status, malformed share links, and safe round trips of over-budget manual rooms.

Server cases cover signed-cookie tampering and expiry, body-size limits, origin rejection, missing prerequisites, hosted browser verification, Redis failure, concurrency lease expiry, quota exhaustion and non-refunded spending reservations. Offline HTTP fixtures exercise the Responses SDK, including incomplete output, invalid proposals, suppressed raw diagnostics and a single provider attempt without automatic retries. The Lua admission tests execute the application's static scripts locally; they do not write to hosted Redis.

## Browser observations

The following interactions were observed in the local browser:

| Interaction | Observed result |
| --- | --- |
| Initial configuration | Studio 140, Loop chair, Halo lamp and Tower shelf total CAD 1,185 |
| Choose Span 180 | Total updates to CAD 1,355 |
| Add Wide shelf with the larger desk | Clearance rejection keeps the previous configuration |
| Choose Folio 110 and Wide shelf | Accepted configuration totals CAD 1,175 |
| Undo the storage change | Tower shelf restored, total CAD 1,055 |
| Change finish, atmosphere and layout | Walnut, evening lighting and right layout are visible in the scene |
| Select the chair mesh | The chair collection controls open |
| Pin the chair | Interface confirms that both chair and upholstery are pinned |
| Generate a share link | A copyable configuration URL remains visible alongside the clipboard action |
| Open the shared room | Folio 110, Loop chair, Halo lamp and Tower shelf restore with walnut, sage, right layout, evening light, CAD 1,500 budget and CAD 1,055 total; pins are cleared and the brief is empty |
| Change view and show dimensions | Plan-view and dimension controls function |
| Mobile layout | At 390 by 844 mobile emulation, the effective 375-pixel layout has no horizontal overflow and the violet Agencies label remains visible |
| Mobile clearance rejection | Selecting Wide shelf with Span 180 keeps the CAD 1,355 configuration and shows the explanation beside the choices |

Share restoration was verified using the visible copyable URL. The clipboard action reported success, but the automation's clipboard read did not independently confirm the copied content; clipboard interoperability remains unverified.

Reducing the manual budget to CAD 1,000 while the selection total was CAD 1,055 showed a CAD 55 over-budget warning. An invalid shared link restored the original studio and displayed an explanatory notice.

## Hosted checks

Vercel reported release `978f3ab` Ready at the public alias [webytex-spatial-showroom.vercel.app](https://webytex-spatial-showroom.vercel.app). The first four interactions below were observed on `5109842`; the fifth was observed after deploying `978f3ab`.

Real paid requests were exercised through the public browser:

| Scenario | Observed result |
| --- | --- |
| Ask for walnut and soft evening light | Only finish and lighting changed. Products, sage upholstery and left layout stayed unchanged. Total: CAD 1,185. |
| Pin the Loop chair and sage upholstery, then ask for a narrower desk | Only Studio 140 changed to Folio 110. The pinned chair and fabric, walnut finish, evening lighting, left layout and other products stayed unchanged. Total: CAD 1,055. |
| Set a CAD 500 budget while the chair and fabric remain pinned | The assistant returned unavailable and explained that a complete setup required a higher budget. The room stayed at CAD 1,055 and displayed CAD 555 over budget. |
| Restore the CAD 1,500 budget, request chalk and day lighting, then manually choose sand upholstery while the request is in progress | The client cancelled the pending request and displayed the room-changed notice. A later UI-state inspection still showed walnut, evening and sand. |
| On `978f3ab`, ask for warm oak and daylight | Finish and lighting changed while all products, the pinned sand upholstery and left layout were preserved. Total: CAD 1,055. |

Deployment request logs recorded HTTP 200 for the first four requests on the initial deployment and the fifth request on `978f3ab`, including the request cancelled by the client. The fourth response body was not observed. Its browser evidence establishes cancellation and retention of the manual change; it does not demonstrate receiving and rejecting a late model response.

The hosted browser console showed no errors. It included the known upstream `THREE.Clock` deprecation warning.

The final public-route probes produced the following results:

| Probe | Observed result |
| --- | --- |
| `GET /api/config` | HTTP 200, `liveEnabled: true` and a signed visitor cookie |
| Valid proposal payload and signed cookie, without BotID proof | HTTP 403 |
| Two invalid proposal payloads | HTTP 400 for each |
| Fourth POST in the probe sequence | HTTP 429 from the deployed WAF |

None of these rejection probes was admitted to the paid provider. These observations establish the checked paths; the broader quota and failure cases remain covered by the offline tests described above.

## Dependency review

The recorded runtime dependency audit reports zero known vulnerabilities. The development dependency tree reports two moderate findings associated with `fengari` and its `sprintf-js` dependency, with no fixed version available in that recorded audit. Fengari is used only to execute the project's static Lua admission scripts in offline tests. It is not part of the application runtime. This distinction does not remove the development dependency finding.

Audit results describe the dependency versions and advisory data available at the time of the check; they are not a lasting security guarantee.

## Reproduce and extend the checks

```sh
npm ci
npm run typecheck
npm test
npm run build
```

For manual review, verify catalogue changes, object selection, all material and atmosphere controls, both camera views, dimensions, undo and reset. Lower the budget below the current total and confirm the warning without losing the manual configuration. Share that room, open the link in a fresh page, and verify selections and budget restore without pins or a brief.

Once live proposals are configured, check that a valid brief produces a validated update; a pin survives a conflicting brief; an impossible request preserves the scene; and a manual change during an in-flight request prevents that response from applying. Confirm the deployed origin, browser verification and admission failures before treating the paid route as verified. Live requests consume allowance and must remain within the deployment owner's approved testing scope.

## Limits of this evidence

The fixed room and rectangular footprint checks are intentionally simplified. They do not establish physical fit in a real room, ergonomics, accessibility or architectural compliance. Browser observations are bounded to the environments actually checked. There is no measured customer, conversion or revenue outcome for this fictional demonstration.
