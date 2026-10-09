# Validation

Status recorded on 8 October 2026. Local implementation, offline verification and hosted verification are separate evidence categories. A passing build does not establish that live proposals work in production.

## Automated local checks

The recorded local baseline passed:

| Command | Result |
| --- | --- |
| `npm test` | 75 tests across six files passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed |

The same 75 tests, type checking and production build passed again after the interface, sharing, layout-label and social-metadata adjustments.

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

Reducing the manual budget to CAD 1,000 while the selection total was CAD 1,055 showed a CAD 55 over-budget warning. An invalid shared link restored the original studio and displayed an explanatory notice. Hosted browser behaviour and a paid live AI proposal remain pending in this record. Local observations do not establish the behaviour of the deployed browser.

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
