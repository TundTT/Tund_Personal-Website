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

The supplied October 10, 2026 website screenshot was checked against the original repository components. The original hero, about text, full MuJoCo and reward-design case study, three-leg recovery, hardware performance and telemetry, WandB/Foxglove tools, other projects, and skills are retained. At the owner's request, the project order is QuadMorph first, PAL Playground second, then the original projects. Existing public technical details come from the original site, not the unpublished manuscript.

The page order is `Hero`, `About`, `RecentWork` (QuadMorph, then PAL Playground), `FeaturedProject`, `DataProcessing`, `OtherProjects`, `RecentExperience`, `Skills`, and `Footer`. Recent experience is added after the original projects, before skills and contact; it does not replace their content.

`public/assets/pal-gallery-preview.jpg` is an actual browser screenshot of the integrated PAL demo, showing the simulator and saved motion gem.

## Gallery collaboration context

The owner clarified that multiple teammates train policies. He built the centralized browser-based gallery to test-drive and evaluate them, compare candidates, and select policies for handoff to the high-level control team for motion planning and gameplay.
