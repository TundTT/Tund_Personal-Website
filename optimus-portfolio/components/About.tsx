export default function About() {
    return (
        <section id="about" className="py-20 bg-zinc-900 text-white">
            <div className="max-w-4xl mx-auto px-6">
                <h2 className="text-3xl font-bold mb-8 border-l-4 border-red-600 pl-4">About Me</h2>
                <div className="prose prose-invert prose-lg text-gray-300">
                    <p className="mb-6">
                        I&apos;m a Mechanical Engineering senior at UW–Madison working on <strong className="text-white">reinforcement learning and sim-to-real transfer for legged and humanoid robots</strong>. I train policies in <strong className="text-white">MuJoCo (MJX/JAX)</strong> with PPO and domain randomization, then test them on real hardware: a morphing quadruped in the LeggedAI Lab, and the Booster K1 humanoid for BadgerBots, our RoboCup team.
                    </p>
                    <p className="mb-6">
                        What I keep coming back to is how much to tell a robot and how much it should find out for itself. On QuadMorph I scripted the motion that never changes and trained a policy for the part that varies. In my capstone I let the environment do the teaching. On RoboCup I&apos;ve seen how far rewards and motion references can take a policy, and where they start to limit it. I&apos;m now working on methods that rely less on hand-written references.
                    </p>
                    <p>
                        I believe capable hardware is useless without intelligent control, and the reverse. Control only works when it understands the machine it runs on, so I try to work on both.
                    </p>
                </div>
            </div>
        </section>
    );
}
