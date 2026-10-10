# Tund Theerawit — personal portfolio

Next.js portfolio preserving the original layout, black/red theme, simulation case studies, charts, videos, earlier projects, and skills. Recent Work features the RoboCup policy gallery and competition result first, followed by QuadMorph, ahead of the original projects. Experience from the fall 2026 résumé appears after the earlier projects.

## Run locally

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The full standalone policy workspace is `/pal-demo/site/index.html`. Use the explicit `index.html` URL: Next's public directory does not automatically resolve directory indexes in development.

## Validate and build

```sh
npm run check:showcase
npm run build
```

The existing `output: 'export'` configuration produces `out/`, including the policy assets. Keep `optimus-portfolio` as the Vercel project root. No new environment variables or backend are needed. Serve the export over HTTP(S), not `file://`. WebGL and WebAssembly are required for the live robot.

## PAL showcase

`public/pal-demo` is a bounded snapshot of PAL Playground's `Gallery` branch at `4ad1b9c`. Only `walk-flat-amp/k1_amp_legs_ref_turn` is included. It has the highest saved Dependability and Performance scores among Tund-authored, rankable checkpoints in the supplied gallery snapshot. This is a relative selection within that snapshot, not a claim about all policies.

- **Drive** runs the actual exported network in the original MuJoCo browser simulator. W/S walk, A/D sidestep, Q/E turn. Joystick, touch buttons, gamepad, camera orbit, and reset are retained.
- **Replay evaluation** plays five real saved rounds, progressively revealing measured motion-gem points. It is clearly labeled as recorded; it does not invent an evaluation or new scores.
- **Run gauntlet / Quick check** run the real evaluator in the browser. Full results are saved locally; there is no repository-write endpoint.
- The motion gem, recorded traces, test outcomes, and failures remain inspectable.
- Embedded mode uses the site's dark palette. The standalone workspace preserves the original gallery design.

The model, policy, meshes, and saved evaluation are unchanged. The manifest's `completedAt` must exactly match the record, including fractional-second formatting; `check:showcase` verifies this plus hashes, paths, authorship, and tour-round availability.

The bundle is approximately 24 MB before transfer compression and loads only after a visitor launches it. Pinned Three.js and MuJoCo WASM dependencies load from jsDelivr. An internet connection is required for these runtime modules. Attribution and licensing are in `public/pal-demo/NOTICE.txt` and `LICENSE-PAL.txt`.

## Content maintenance

See `SOURCE_NOTES.md` for biography and imagery provenance. Both résumé download paths intentionally serve the updated document. QuadMorph is an ICRA submission under review; the website includes selected hardware photographs, not the manuscript, full figures, equations, training settings, or quantitative research results.

`app/page.tsx` mounts `Hero`, `About`, `RecentWork`, `FeaturedProject`, `DataProcessing`, `OtherProjects`, `RecentExperience`, `Skills`, and `Footer` in that order. `components/RecentWork.tsx` presents the RoboCup policy gallery and competition result first, followed by QuadMorph. The original projects retain their order and content; recent experience follows them before skills and contact. The hero includes a shortcut to the new work. All original media remain available.

The rolling configuration photo has an AI-enhanced presentation version. The original is retained in the assets directory; the page uses a simple hardware-configuration caption at the owner’s request. See `IMAGE_ENHANCEMENT.md` for the exact prompt and limitations.
