"use client";

import Image from "next/image";
import { useState } from "react";

const demoUrl = "/pal-demo/site/index.html";

export default function RecentWork() {
  const [mode, setMode] = useState<"rolling" | "walking">("rolling");

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
                  alt="BadgerBots teammates with their humanoid robots in Beijing, 2026"
                  width={1727}
                  height={1219}
                  className="w-full h-auto lg:h-full object-cover"
                />
                <figcaption className="px-5 py-3 text-xs text-gray-400 bg-black/40">
                  BadgerBots in Beijing, 2026 · Photo from the official team site
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
                  World Humanoid Robot Games
                </h4>
                <p className="text-sm text-gray-400 mb-5">
                  2026 · Beijing · Humanoid Robot Soccer
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Our BadgerBots team placed fourth in robot soccer. As
                  Low-Level Control Co-Lead for UW–Madison’s RoboCup team, I
                  train locomotion and ball-interception policies for the
                  Booster K1, help teammates learn the RL workflow, and deploy
                  policies on the robots at competition.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-[1fr_2fr] gap-4 mb-8">
              {[
                {
                  src: "robocup-2026-incheon-1.jpg",
                  w: 949,
                  h: 1069,
                  alt: "A teammate kicks a ball back and forth with a Booster K1 humanoid on the RoboCup 2026 field in Incheon",
                },
                {
                  src: "robocup-2026-incheon-2.jpg",
                  w: 1477,
                  h: 682,
                  alt: "Testing a policy on a Booster K1 humanoid beside the goal at RoboCup 2026 in Incheon, with a teammate holding a laptop",
                },
              ].map((photo) => (
                <figure
                  key={photo.src}
                  className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900"
                >
                  <Image
                    src={`/assets/badgerbots/${photo.src}`}
                    alt={photo.alt}
                    width={photo.w}
                    height={photo.h}
                    className="w-full h-full object-cover"
                  />
                </figure>
              ))}
              <p className="md:col-span-2 text-xs text-gray-400">
                Testing on the Booster K1 at RoboCup 2026 in Incheon, South
                Korea.
              </p>
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

            <iframe
              tabIndex={0}
              src={`${demoUrl}?embed=1`}
              loading="eager"
              title="PAL Playground: drive Tund’s K1 walking policy and explore recorded evaluations"
              allow="fullscreen; gamepad"
              allowFullScreen
              className="block w-full h-[820px] md:h-[900px] border-0 bg-black"
            />
            <div className="px-5 py-4 border-t border-zinc-800 text-sm text-gray-400">
              Click Load policy to start the simulation · Evaluation tour uses
              recorded results
            </div>
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
              QuadMorph is built on Stanford’s open-source Pupper v3 quadruped.
              Its lower legs are shape-memory-polymer wheels that soften with
              heat, reshape under the robot’s own weight, and hold the new shape
              as they cool, so the robot can switch between rolling and walking
              using only its existing joint motors. As first author I designed
              the mechanism and trained the policies that control it, tying
              together mechanical design, simulation, and learned control on the
              physical robot.
            </p>
            <p className="text-gray-400 leading-relaxed max-w-3xl mt-4">
              The polymer never reshapes to exactly the same leg length, about
              1 cm of variation, so I trained the walking policy with varied leg
              lengths and used IMU and joint data to detect the difference.
              Motions that never change, like turning a wheel to a fixed angle,
              stay as plain scripted commands. Teammate Ethan Dretzka built the
              heating circuit, and Prof. Xiaobin Xiong advised the project.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              {[
                {
                  src: "wheel-to-leg",
                  label: "Wheel to leg",
                  note: "Heated, the wheel softens and the robot’s weight reshapes it. Shown at 4× speed.",
                },
                {
                  src: "leg-to-wheel",
                  label: "Leg to wheel",
                  note: "Reheated with no load, the shin returns to its wheel shape. Shown at 4× speed.",
                },
              ].map((item) => (
                <figure
                  key={item.src}
                  className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900"
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    poster={`/assets/quadmorph/${item.src}-poster.jpg`}
                    className="w-full h-auto max-h-[640px] object-contain bg-black"
                    aria-label={`QuadMorph end effector, ${item.label.toLowerCase()} transition on the real robot`}
                  >
                    <source src={`/assets/quadmorph/${item.src}.mp4`} type="video/mp4" />
                  </video>
                  <figcaption className="px-5 py-4 text-sm text-gray-300">
                    <span className="text-white font-semibold">{item.label}</span>
                    <span className="block text-gray-400 mt-1">{item.note}</span>
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
          <div className="grid md:grid-cols-3 gap-8">
            <article className="p-6 rounded-lg bg-zinc-900 border border-zinc-800">
              <p className="text-xs font-mono text-zinc-400 mb-3">
                JANUARY 2026 – PRESENT
              </p>
              <h4 className="text-xl font-bold mb-1">
                BadgerBots · UW–Madison RoboCup
              </h4>
              <p className="text-red-400 mb-4">
                Current Low-Level Control Co-Lead
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                I co-lead a 10-person motion-control team within our roughly
                50-member club, coordinating with the infrastructure,
                localization, and behavior teams so walking, kicking, and
                recovery work as one system. I teach new members the full RL
                workflow, from MuJoCo models to hardware deployment, and I
                help repair robots at competition alongside Booster engineers.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mt-3">
                Our team placed 4th of 14 in robot soccer at the World
                Humanoid Robot Games in Beijing.
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
                integration and locomotion policy training. First author on
                a paper submitted to IEEE ICRA, under review.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mt-3">
                B.S. Mechanical Engineering with a Certificate in Data Science
                at UW–Madison · GPA 3.86 · Dean’s Honor List every semester ·
                Expected May 2027.
              </p>
            </article>
            <article className="p-6 rounded-lg bg-zinc-900 border border-zinc-800">
              <p className="text-xs font-mono text-zinc-400 mb-3">
                FALL 2026 – SPRING 2027
              </p>
              <h4 className="text-xl font-bold mb-1">
                Senior Capstone · Bio-Inspired Tail
              </h4>
              <p className="text-red-400 mb-4">
                UW–Madison ME · Advisor: Prof. Peter Adamczyk
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Designing a tail and whole-body controller for a Unitree Go2 so
                a quadruped can correct body roll when its footing is
                unreliable, as on construction sites. The design and controller
                are still in development.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mt-3">
                Early simulation result: on a narrow beam under random pushes,
                the policy learned on its own to whip the tail toward the
                tipping side, and a tailless Go2 fell every time. Hardware
                testing is still ahead.
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
