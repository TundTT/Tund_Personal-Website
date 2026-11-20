# Portfolio source notes

Updated October 10, 2026 from materials supplied by Tund Theerawit.

## Biography and resume

- The supplied fall 2026 resume is the primary source for current roles, education, skills, and research status. It replaces both `public/Tund_Theerawit_Resume.pdf` and `public/resume.pdf`; these two downloads intentionally contain the same document.
- The supplied October 10, 2026 LinkedIn capture corroborates the robotics, reinforcement learning, and sim-to-real focus. Where names differ, the current resume takes precedence: use **LeggedAI Lab**.
- Education: B.S. Mechanical Engineering and Certificate in Data Science, University of Wisconsin-Madison, expected May 2027.
- Current roles: Undergraduate Robotics Researcher at LeggedAI Lab (May 2025-present) and Low-Level Control Co-Lead for BadgerBots, the UW-Madison RoboCup team (team member since fall 2025).
- The resume describes QuadMorph as submitted to ICRA and under review. Do not describe it as accepted or published without a subsequent status update.

## QuadMorph visuals

The five original PNGs in `public/assets/quadmorph/` are selected hardware-photo regions rendered from the supplied QuadMorph manuscript. They retain the original photography; they are not generated illustrations or simulated results. A sixth file, `quadmorph-rolling-enhanced.png`, is an AI-enhanced presentation copy requested by the owner; it reconstructs fine details. The original file is preserved; the owner requested a simple configuration caption without enhancement wording on the page. See `IMAGE_ENHANCEMENT.md` for the exact prompt and provenance.

| Asset                        | Source region                  | Intended description                                            |
| ---------------------------- | ------------------------------ | --------------------------------------------------------------- |
| `quadmorph-rolling.png`      | Figure 1, left hardware photo  | Robot in wheel configuration                                    |
| `quadmorph-walking.png`      | Figure 1, right hardware photo | Robot in walking configuration                                  |
| `quadmorph-wheel-detail.png` | Figure 2, first upper photo    | Wheel before reshaping                                          |
| `quadmorph-morph-detail.png` | Figure 2, second upper photo   | Shin during reshaping                                           |
| `quadmorph-leg-detail.png`   | Figure 2, third upper photo    | Reconfigured shin, before rotating its tip into walking contact |

The page may explain the high-level concept: the same smart-material structure changes between wheel and leg geometries, connecting mechanical design with learned locomotion control. The image switch compares physical configurations; it is not a measured locomotion benchmark.

At the owner's request, the unpublished manuscript itself is omitted from the public site. The selected regions omit manuscript text, figure captions, timing annotations, equations, training settings, material recipes, and unpublished quantitative results. Do not add a paper download or publish full figures without a later request from the owner.

## Original website

The supplied October 10, 2026 website screenshot was checked against the original repository components. The original hero layout, about text, full MuJoCo and reward-design case study, three-leg recovery, hardware performance and telemetry, WandB/Foxglove tools, other projects, and skills are retained. At the owner's request, the project order is the RoboCup policy gallery and competition result first, then QuadMorph and the original Pupper projects. Existing public technical details come from the original site, not the unpublished manuscript.

The page order is `Hero`, `About`, `RecentWork` (RoboCup policy gallery, then QuadMorph), `FeaturedProject`, `DataProcessing`, `OtherProjects`, `RecentExperience`, `Skills`, and `Footer`. Recent experience is added after the original projects, before skills and contact; it does not replace their content.

The PAL gallery is embedded directly and loads automatically. Visitors start the robot through its Load policy control; the former screenshot and launch gate have been removed.

## Gallery collaboration context

The owner clarified that multiple teammates train policies. He built the centralized browser-based gallery to test-drive and evaluate them, compare candidates, and select policies for handoff to the high-level control team for motion planning and gameplay.

## Official team website and confirmed competition result

The owner supplied https://badger-bots-github-io.vercel.app/ and requested reuse of team elements. The site's crest, robot lineup, and 2026 team photograph are copied unchanged into `public/assets/badgerbots/`; the portfolio links back to the team site and credits the team photo. The homepage backdrop now features the team's humanoids. Original Pupper videos remain in the quadruped case study.

The résumé states 4th of 14 teams in robot soccer, using the event name World Humanoid Robot Games. The official team site uses RoboCup Asia-Pacific Beijing Masters (2026, Humanoid Soccer League, Middle Division 5v5, international teams). On October 10, 2026 the owner explicitly confirmed that the portfolio should use the team site's event name. The fourth-place result remains a team achievement, not a claim that the gallery or featured policy individually earned that result.

Source assets:

- https://badger-bots-github-io.vercel.app/assets/badgerbots-logo.png → `logo.png`
- https://badger-bots-github-io.vercel.app/assets/badgerbots-rcap-team-2026.jpg → `team-2026.jpg`
- https://badger-bots-github-io.vercel.app/assets/robots-2026.png → `robots-2026.png`

## Sync with resume, SOP and story bank (11 November 2026)

- `public/Tund_Theerawit_Resume.pdf` and `public/resume.pdf` are now the 11 November 2026 CV (`Tund_Theerawit_CV_2026-11-11`).
- BadgerBots start date is January 2026 (not fall 2025). Motion control is a 10-person team within a ~50-member club. The Booster repair was done alongside a Booster engineer, never solo.
- Added the senior capstone (bio-inspired tail, Unitree Go2, Prof. Adamczyk). The tail result is simulation only; do not claim hardware results.
- QuadMorph is first-author, under review at ICRA. The heating circuit was Ethan Dretzka's work; do not describe it as Tund's.
- Skills list matches the CV. About text avoids framing the research as simulator or physics-engine work.
- Still unverified against the CV or story bank: AI Group description (A* planning), CATS Lab description, the "Custom RL Environments" card, and the Featured Project claims about building the MJX model (the repo vendors Stanford's Pupper v3 pipeline).

- Update (11 November 2026): Tund says World Humanoid Robot Games is the more accurate event name; the site now uses it and drops the RoboCup Asia-Pacific division details. AI Group card covers both A* planning and the line-following/PID work. CATS Lab "Ranger" is the wheeled platform robot, so that card stands. "Custom RL Environments" card removed. Featured Project now says adapted Stanford Pupper v3 pipeline.
- Media added 11 November 2026 (supplied by Tund): two RoboCup 2026 Incheon field photos (`public/assets/badgerbots/robocup-2026-incheon-*.jpg`) and two QuadMorph hardware videos, re-encoded without audio at 720 px wide (`public/assets/quadmorph/wheel-to-leg.mp4` at 4x speed; `leg-to-wheel.mp4` trimmed to its second half, from 75 s, at 4x speed; both with poster frames). Captions state the playback speed. No text, timings or results appear in the footage.
