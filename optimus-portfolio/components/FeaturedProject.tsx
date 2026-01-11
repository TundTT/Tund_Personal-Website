import Image from 'next/image';

export default function FeaturedProject() {
    return (
        <section id="featured-project" className="py-24 bg-black text-white">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-12">
                    <h2 className="text-4xl font-bold mb-4">Featured Project</h2>
                    <h3 className="text-3xl text-red-500 font-semibold">High-Fidelity MuJoCo Digital Twin with Domain Randomization & PPO</h3>
                    <p className="text-gray-400 mt-2">Pupper Quadruped • Sim-to-Real Transfer • JAX/MJX</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-start">
                    {/* Visuals */}
                    <div className="space-y-6">
                        {/* Main comparison video/gif */}
                        <div className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 shadow-2xl">
                            <Image
                                src="/assets/pupperwalkdomain.gif" // Using the same gif for now, ideally side-by-side
                                alt="Sim to Real Comparison"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 text-sm rounded">Simulated Environment</div>
                        </div>

                        {/* Secondary visual - Kinematics */}
                        <div className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 shadow-2xl">
                            <Image
                                src="/assets/kinematics.gif"
                                alt="Kinematics Simulation"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 text-sm rounded">Kinematics Analysis</div>
                        </div>
                    </div>

                    {/* Technical Details */}
                    <div>
                        <div className="space-y-8">
                            <div>
                                <h4 className="text-xl font-bold mb-2 text-white">Technical Overview</h4>
                                <ul className="space-y-3 text-gray-300 list-disc pl-5">
                                    <li>Built accurate actuator, sensor, and dynamics model in <span className="text-red-400 font-mono">MJX/JAX</span> for parallelized simulation.</li>
                                    <li>Designed custom reward functions (velocity tracking, torque penalties, smoothness) yielding <span className="text-white font-bold">10% energy reduction</span>.</li>
                                    <li>Implemented <span className="text-white font-bold">domain randomization</span> (friction, mass, terrain) for robust sim-to-real transfer.</li>
                                    <li>Trained <span className="text-red-400 font-mono">PPO policies</span> achieving stable forward velocity tracking at 0.75 m/s.</li>
                                </ul>
                            </div>

                            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
                                <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Relevance to Embodied AI</h4>
                                <p className="text-gray-300 italic">
                                    "This pipeline demonstrates scalable techniques for training locomotion policies in simulation that transfer to hardware—directly relevant to developing realistic worlds and neural simulators for humanoid autonomy."
                                </p>
                            </div>

                            {/* Hybrid Locomotion Highlight */}
                            <div className="bg-zinc-900/50 p-6 rounded-lg border border-red-900/30">
                                <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                                    New: Hybrid Wheeled-Legged Locomotion
                                </h4>
                                <p className="text-gray-400 text-sm mb-4">
                                    Novel gait combining legged mechanics with wheel assistance. Designed for efficient rough terrain traversal where wheels act as active dampeners and propulsors.
                                </p>
                                <div className="relative aspect-video rounded-md overflow-hidden border border-zinc-700">
                                    <Image
                                        src="/assets/hybrid locomotion.gif"
                                        alt="Hybrid Wheeled-Legged Locomotion"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                            </div>

                            <div>
                                <a
                                    href="https://github.com/TundTT?tab=repositories" // Replace with specific repo if known
                                    target="_blank"
                                    className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-md transition-colors font-mono"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                                    View Repository
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
