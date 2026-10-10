"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const demoUrl = "/pal-demo/site/index.html";

export default function RecentWork() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [mode, setMode] = useState<"rolling" | "walking">("rolling");
  const launchButton = useRef<HTMLButtonElement>(null);
  const demoFrame = useRef<HTMLIFrameElement>(null);
  const hasOpened = useRef(false);

  useEffect(() => {
    if (demoOpen) {
      hasOpened.current = true;
      demoFrame.current?.focus();
    } else if (hasOpened.current) {
      launchButton.current?.focus();
    }
  }, [demoOpen]);

  return (
    <section
      id="recent-work"
      className="py-24 bg-black text-white border-t border-zinc-800"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-4 border-l-4 border-red-600 pl-4">
            Recent Work
          </h2>
          <p className="text-gray-400 text-lg">
            From RoboCup competition and policy evaluation to Pupper quadruped
            research.
          </p>
        </div>

        <article
          id="playground"
          aria-labelledby="pal-title"
          className="scroll-mt-8"
        >
          <div className="mb-8">
            <p className="text-sm text-gray-400 font-mono mb-3">
              BADGERBOTS • UW–MADISON ROBOCUP • PAL PLAYGROUND
            </p>
            <h3
              id="pal-title"
              className="text-3xl font-semibold text-red-500 mb-4"
            >
              RoboCup: Interactive Policy Gallery
            </h3>
            <div className="my-8 grid lg:grid-cols-[1.1fr_1fr] rounded-lg overflow-hidden border border-red-900/40 bg-zinc-900">
              <figure className="flex flex-col">
                <Image
                  src="/assets/badgerbots/team-2026.jpg"
                  alt="BadgerBots teammates with their humanoid robots at RCAP 2026 in Beijing"
                  width={1727}
                  height={1219}
                  className="w-full h-auto lg:h-full object-cover"
                />
                <figcaption className="px-5 py-3 text-xs text-gray-400 bg-black/40">
                  BadgerBots at RCAP 2026 · Photo from the official team site
                </figcaption>
              </figure>
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <a
                  href="https://badger-bots-github-io.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 mb-6 text-gray-300 hover:text-white transition-colors"
                >
                  <Image
                    src="/assets/badgerbots/logo.png"
                    alt="BadgerBots crest"
                    width={56}
                    height={56}
                    className="shrink-0"
                  />
                  <span>
                    <strong className="block text-white">BadgerBots</strong>
                    <span className="text-sm">
                      UW–Madison RoboCup · Team website ↗
                    </span>
                  </span>
                </a>
                <p className="text-5xl font-bold text-red-500">
                  4th{" "}
                  <span className="text-lg text-gray-400 font-normal">
                    of 14 teams
                  </span>
                </p>
                <h4 className="text-xl font-semibold text-white mt-3 mb-2">
                  RoboCup Asia-Pacific Beijing Masters
                </h4>
                <p className="text-sm text-gray-400 mb-5">
                  2026 · Humanoid Soccer · Middle Division 5v5 · International
                  Teams
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Our BadgerBots team placed fourth in robot soccer. As
                  Low-Level Control Co-Lead for UW–Madison’s RoboCup team, I
                  work on locomotion policies, deployment, and hardware
                  recovery.
                </p>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed max-w-3xl">
              With several RoboCup teammates training policies, I built the PAL
              Playground gallery as a central, browser-based space to test-drive
              and evaluate our work. It helps us compare policies and select the
              best ones to hand off to the high-level control team for motion
              planning and gameplay.
            </p>
            <p className="text-gray-400 mt-3">
              Try one of my trained K1 walking policies below.
            </p>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 border-b border-zinc-800">
              <span className="font-mono text-sm text-gray-300">
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2" />
                K1 POLICY DEMO
              </span>
              <a
                href={`${demoUrl}?embed=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Open full workspace <span aria-hidden="true">↗</span>
              </a>
            </div>

            {demoOpen ? (
              <div>
                <iframe
                  ref={demoFrame}
                  tabIndex={0}
                  src={`${demoUrl}?embed=1`}
                  title="PAL Playground: drive Tund’s K1 walking policy and explore recorded evaluations"
                  allow="fullscreen; gamepad"
                  allowFullScreen
                  className="block w-full h-[820px] md:h-[900px] border-0 bg-black"
                />
                <div className="flex flex-wrap justify-between items-center gap-3 p-5 border-t border-zinc-800 text-sm">
                  <p className="text-gray-400">
                    Live policy simulation · Evaluation tour uses recorded
                    results
                  </p>
                  <button
                    type="button"
                    onClick={() => setDemoOpen(false)}
                    className="text-white hover:text-red-400 cursor-pointer"
                  >
                    Close demo ×
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <Image
                  src="/assets/pal-gallery-preview.jpg"
                  alt="The PAL gallery showing Tund’s K1 policy in the simulator alongside its measured motion gem"
                  width={1280}
                  height={720}
                  className="w-full h-auto"
                />
                <div className="p-6 md:p-8 grid md:grid-cols-[1fr_auto] gap-8 items-center">
                  <div>
                    <h4 className="text-xl font-bold mb-3">
                      Drive it. Replay the evaluation. Explore its limits.
                    </h4>
                    <p className="text-gray-400 leading-relaxed max-w-2xl">
                      Walk, sidestep, and turn with the keyboard or joystick.
                      Then replay five saved evaluation rounds and explore the
                      motion gem to see how the policy performs across
                      directions and speeds.
                    </p>
                    <p className="text-xs text-zinc-500 mt-4">
                      Actual gallery interface shown. The simulation loads when
                      you launch it.
                    </p>
                  </div>
                  <div>
                    <button
                      ref={launchButton}
                      type="button"
                      onClick={() => setDemoOpen(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-full transition-colors cursor-pointer"
                    >
                      Launch interactive demo <span aria-hidden="true">↗</span>
                    </button>
                    <p className="text-xs text-gray-400 mt-3">
                      Desktop recommended · Touch controls included
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-6">
            {[
              {
                title: "Live policy control",
                text: "The trained network runs in the browser with MuJoCo physics. W/S walk, A/D sidestep, and Q/E turn.",
              },
              {
                title: "Evaluation you can inspect",
                text: "The guided tour replays real saved trials. You can also run a fresh quick check or full evaluation in your browser.",
              },
              {
                title: "Motion gem",
                text: "Explore the measured motion envelope and the tests behind the scores, including the policy’s limitations.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800"
              >
                <h4 className="text-red-400 font-semibold mb-2">
                  {item.title}
                </h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article
          id="quadmorph"
          aria-labelledby="quad-title"
          className="mt-20 border-t border-zinc-800 pt-16 scroll-mt-8"
        >
          <div className="mb-8">
            <p className="text-sm text-gray-400 font-mono mb-3">
              PUPPER QUADRUPED • LEGGEDAI LAB • MECHANICAL DESIGN
            </p>
            <h3
              id="quad-title"
              className="text-3xl font-semibold text-red-500 mb-4"
            >
              QuadMorph: Wheels That Change Shape
            </h3>
            <p className="text-gray-300 leading-relaxed max-w-3xl">
              My quadruped research centers on Pupper, a four-legged robot.
              QuadMorph adds morphing end effectors that let it roll or walk. My
              work connects mechanical design, simulation, and learned control
              on the physical platform.
            </p>
            <span className="inline-flex items-center gap-2 text-xs text-red-400 bg-red-950/20 border border-red-900/40 rounded-full px-3 py-1.5 mt-5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              ICRA submission · Under review
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <figure className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
              <Image
                src={`/assets/quadmorph/quadmorph-${mode === "rolling" ? "rolling-enhanced" : "walking"}.png`}
                alt={
                  mode === "rolling"
                    ? "QuadMorph with its end effectors in the wheel configuration"
                    : "QuadMorph research robot with its end effectors reshaped into walking feet"
                }
                width={mode === "rolling" ? 1421 : 795}
                height={mode === "rolling" ? 1107 : 620}
                className="w-full h-auto"
              />
              <figcaption className="px-5 py-3 text-sm text-gray-400 border-t border-zinc-800">
                {mode === "rolling"
                  ? "Wheel configuration · QuadMorph hardware"
                  : "Walking configuration · QuadMorph hardware"}
              </figcaption>
            </figure>
            <div>
              <h4 className="text-2xl font-bold mb-4">
                One platform, two ways to move
              </h4>
              <div
                role="group"
                aria-label="Compare robot configurations"
                className="inline-flex p-1 gap-1 bg-zinc-900 border border-zinc-700 rounded-lg mb-6"
              >
                {(["rolling", "walking"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={mode === value}
                    onClick={() => setMode(value)}
                    className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-colors cursor-pointer ${mode === value ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"}`}
                  >
                    {value === "rolling" ? "Rolling" : "Walking"}
                  </button>
                ))}
              </div>
              <div aria-live="polite">
                <h5 className="text-lg font-semibold text-white mb-3">
                  {mode === "rolling"
                    ? "Circular wheels for rolling"
                    : "Reshaped feet for walking"}
                </h5>
                <p className="text-gray-400 leading-relaxed">
                  {mode === "rolling"
                    ? "The end effectors form wheels, supporting rolling locomotion on the same quadruped platform."
                    : "The end effectors change their geometry to become walking feet, giving the robot another way to interact with the ground."}
                </p>
              </div>
              <p className="text-sm text-zinc-500 mt-6">
                A visual comparison of the hardware configurations. Research
                methods and results will be shared with the paper.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <h4 className="text-xl font-bold mb-6">
              A closer look at the morphing mechanism
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { src: "wheel", label: "Wheel configuration" },
                { src: "morph", label: "Changing shape" },
                { src: "leg", label: "Reconfigured shin" },
              ].map((item, index) => (
                <figure
                  key={item.src}
                  className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900"
                >
                  <Image
                    src={`/assets/quadmorph/quadmorph-${item.src}-detail.png`}
                    alt={`QuadMorph end effector: ${item.label.toLowerCase()}`}
                    width={499}
                    height={499}
                    className="w-full h-auto"
                  />
                  <figcaption className="px-5 py-4 text-sm text-gray-300">
                    <span className="text-red-500 font-mono mr-3">
                      0{index + 1}
                    </span>
                    {item.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export function RecentExperience() {
  return (
    <section className="py-20 bg-black text-white border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-6">
        <div>
          <h3 className="text-3xl font-bold mb-8">Recent Experience</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <article className="p-6 rounded-lg bg-zinc-900 border border-zinc-800">
              <p className="text-xs font-mono text-zinc-400 mb-3">
                FALL 2025 – PRESENT
              </p>
              <h4 className="text-xl font-bold mb-1">
                BadgerBots · UW–Madison RoboCup
              </h4>
              <p className="text-red-400 mb-4">
                Current Low-Level Control Co-Lead
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                I co-lead a five-person motion-control team, connecting walking,
                kicking, and recovery with the rest of our humanoid system. My
                work includes policy deployment and live hardware recovery at
                RoboCup.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mt-3">
                Our team placed 4th of 14 in robot soccer at the RoboCup
                Asia-Pacific Beijing Masters.
              </p>
            </article>
            <article className="p-6 rounded-lg bg-zinc-900 border border-zinc-800">
              <p className="text-xs font-mono text-zinc-400 mb-3">
                MAY 2025 – PRESENT
              </p>
              <h4 className="text-xl font-bold mb-1">LeggedAI Lab</h4>
              <p className="text-red-400 mb-4">
                Undergraduate Robotics Researcher
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Mechanical design, simulation, and learned control for
                QuadMorph, from custom morphing end effectors to hardware
                integration and locomotion policy training.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mt-3">
                B.S. Mechanical Engineering with a Certificate in Data Science
                at UW–Madison · Expected May 2027.
              </p>
            </article>
          </div>
          <a
            href="/Tund_Theerawit_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex mt-8 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-full text-sm transition-colors"
          >
            View updated resume{" "}
            <span aria-hidden="true" className="ml-2">
              ↗
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
