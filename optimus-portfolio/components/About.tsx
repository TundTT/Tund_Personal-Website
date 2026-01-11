export default function About() {
    return (
        <section id="about" className="py-20 bg-zinc-900 text-white">
            <div className="max-w-4xl mx-auto px-6">
                <h2 className="text-3xl font-bold mb-8 border-l-4 border-red-600 pl-4">About Me</h2>
                <div className="prose prose-invert prose-lg text-gray-300">
                    <p className="mb-6">
                        I develop physics-accurate digital twins in <strong className="text-white">MuJoCo (MJX/JAX)</strong> and train reinforcement learning policies (PPO) with domain randomization to achieve robust <strong className="text-white">sim-to-real transfer</strong> on legged robots.
                    </p>
                    <p className="mb-6">
                        My current research focuses on reward shaping and simulation fidelity to enable efficient, stable locomotion—skills directly applicable to accelerating autonomy stacks for general-purpose humanoid platforms. I am passionate about neural and physics-based simulators that close the sim-to-real gap.
                    </p>

                    <p>
                        I am a Mechanical Engineer working on simulation and neural network control. I firmly believe that capable hardware is useless without intelligent controls, and vice versa. Mastering the intersection of both disciplines is the key to driving real progress in robotics.
                    </p>
                </div>
            </div>
        </section>
    );
}
