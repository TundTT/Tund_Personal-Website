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
                                    <li>Implemented <strong>exponential velocity tracking</strong> to minimize sensitivity near target speeds (v_d).</li>
                                    <li>Designed custom "Effort Conservation" rewards penalizing <strong>joint torques, acceleration, mechanical work, and action rate</strong> (tuned to 10⁻⁴ scale).</li>
                                    <li>Trained <span className="text-red-400 font-mono">PPO policies</span> for over <strong>300 million timesteps</strong>, achieving stable 0.75 m/s locomotion.</li>
                                    <li>Utilized extensive domain randomization (friction, mass, terrain) to bridge the sim-to-real gap.</li>
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
                                    href="https://github.com/TundTT"
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





                {/* Full Width Reward Engineering Section */}
                <div className="mt-20 border-t border-zinc-800 pt-16">
                    <h3 className="text-4xl font-bold text-white mb-12 flex items-center gap-4">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                        Reward Engineering & Function Design
                    </h3>

                    {/* Top Row: Velocity Tracking & Effort Conservation side by side */}
                    <div className="grid lg:grid-cols-2 gap-16 mb-16">
                        {/* Exponential Velocity */}
                        <div className="space-y-6">
                            <h4 className="text-2xl font-bold text-white flex items-center gap-3">
                                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                                Exponential Velocity Tracking
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative aspect-square bg-white rounded-lg overflow-hidden p-2">
                                    <Image
                                        src="/assets/graph.png"
                                        alt="Exponential Reward Function Graph"
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                                <div className="relative aspect-square rounded-lg overflow-hidden border border-zinc-700">
                                    <Image
                                        src="/assets/velocity track only approach.gif"
                                        alt="Naive Velocity Tracking Behavior"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 text-xs rounded text-red-400">Naive Tracking Behavior</div>
                                </div>
                            </div>
                            <p className="text-base text-gray-400 leading-relaxed">
                                Replaced quadratic penalties with an <strong>exponential tracking function</strong> (sigma=0.25) to create a sharp gradient near target velocity (1.0 m/s). This tackled the "lazy agent" problem where policies would settle for sub-optimal speeds to avoid actuation costs.
                            </p>
                        </div>

                        {/* Effort Conservation */}
                        <div className="space-y-6">
                            <h4 className="text-2xl font-bold text-white flex items-center gap-3">
                                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
                                Effort Conservation
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-700">
                                    <Image
                                        src="/assets/too little.gif"
                                        alt="Penalizing Effort Too Little"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 text-xs rounded text-red-400">Penalize Too Little</div>
                                </div>
                                <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-700">
                                    <Image
                                        src="/assets/too much.gif"
                                        alt="Penalizing Effort Too Much"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 text-xs rounded text-red-400">Penalize Too Much</div>
                                </div>
                            </div>
                            <p className="text-base text-gray-400 leading-relaxed">
                                Balancing conflicting priorities: <strong>Penalizing too little</strong> results in unstable, high-energy gait. <strong>Penalizing too much</strong> freezes the robot. Found the "sweet spot" at 10⁻⁴ scale for natural motion.
                            </p>
                        </div>
                    </div>

                    {/* Full Width: Reward Analysis Charts */}
                    <div className="mb-16">
                        <h4 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
                            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            Reward Analysis & Component Scaling
                        </h4>
                        <div className="grid md:grid-cols-2 gap-8 mb-6">
                            <div className="relative aspect-[16/10] rounded-lg overflow-hidden border border-zinc-700 bg-white">
                                <Image
                                    src="/assets/reward_distribution.png"
                                    alt="Reward Component Distribution"
                                    fill
                                    className="object-contain p-4"
                                    unoptimized
                                />
                            </div>
                            <div className="relative aspect-[16/10] rounded-lg overflow-hidden border border-zinc-700 bg-white">
                                <Image
                                    src="/assets/reward_distribution_pi.png"
                                    alt="Policy Reward Distribution"
                                    fill
                                    className="object-contain p-4"
                                    unoptimized
                                />
                            </div>
                        </div>
                        <p className="text-base text-gray-400 leading-relaxed max-w-4xl">
                            Utilized distribution plots to tune reward scales, ensuring the <strong>tracking objective dominates</strong> while penalties actively shape behavior without paralysis.
                        </p>
                    </div>

                    {/* Full Width: Code Implementation */}
                    <div>
                        <h4 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
                            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                            Core Reward Implementation (JAX)
                        </h4>
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Tracking Lin Vel */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                                <h5 className="font-bold text-red-400 mb-2 text-lg">Tracking Linear Velocity</h5>
                                <p className="text-gray-400 mb-4 text-sm">
                                    Exponential decay of squared error between actual and commanded local velocity.
                                </p>
                                <div className="bg-black p-4 rounded text-sm overflow-x-auto font-mono leading-relaxed text-gray-300">
                                    <div>
                                        <span className="text-blue-400">def</span> <span className="text-yellow-300">reward_tracking_lin_vel</span>(commands, x, xd, tracking_sigma):
                                    </div>
                                    <div className="pl-4">
                                        local_vel = <span className="text-yellow-300">math.rotate</span>(xd.vel[0], <span className="text-yellow-300">math.quat_inv</span>(x.rot[0]))
                                    </div>
                                    <div className="pl-4">
                                        lin_vel_error = <span className="text-yellow-300">jp.sum</span>(<span className="text-yellow-300">jp.square</span>(commands[:2] - local_vel[:2]))
                                    </div>
                                    <div className="pl-4">
                                        <span className="text-blue-400">return</span> <span className="text-yellow-300">jp.exp</span>(-lin_vel_error / tracking_sigma)
                                    </div>
                                </div>
                            </div>

                            {/* Torque Penalty */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                                <h5 className="font-bold text-red-400 mb-2 text-lg">Torque Penalty</h5>
                                <p className="text-gray-400 mb-4 text-sm">
                                    Sum of squared torques to minimize energy and prevent excessive force.
                                </p>
                                <div className="bg-black p-4 rounded text-sm overflow-x-auto font-mono leading-relaxed text-gray-300">
                                    <div>
                                        <span className="text-blue-400">def</span> <span className="text-yellow-300">reward_torques</span>(torques):
                                    </div>
                                    <div className="pl-4">
                                        <span className="text-blue-400">return</span> <span className="text-yellow-300">jp.sum</span>(<span className="text-yellow-300">jp.square</span>(torques))
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Policy Performance Results */}
                <div className="mt-16 border-t border-zinc-800 pt-12">
                    <h3 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Policy Performance & Simulation Results
                    </h3>

                    <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {/* Left: Random Movement */}
                        <div className="relative aspect-square lg:aspect-auto h-full min-h-[400px] rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
                            <Image
                                src="/assets/pupperwalkdomain.gif"
                                alt="Random movement on rough terrain"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded border-l-4 border-red-500">
                                <h4 className="font-bold text-lg text-white">Random Movement</h4>
                                <p className="text-xs text-gray-400">Robust traversal on non-flat terrain</p>
                            </div>
                        </div>

                        {/* Right: Targeted Velocity */}
                        <div className="flex flex-col gap-6 h-full">
                            {/* Y Axis */}
                            <div className="relative flex-1 aspect-video rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
                                <Image
                                    src="/assets/results_y_0.75.gif"
                                    alt="Y Axis Movement at 0.75 m/s"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-1 rounded border-l-4 border-blue-500">
                                    <h4 className="font-bold text-base text-white">Y 0.75 (m/s)</h4>
                                </div>
                            </div>

                            {/* X Axis */}
                            <div className="relative flex-1 aspect-video rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
                                <Image
                                    src="/assets/results_x_0.75.gif"
                                    alt="X Axis Movement at 0.75 m/s"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-1 rounded border-l-4 border-green-500">
                                    <h4 className="font-bold text-base text-white">X 0.75 (m/s)</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hardware Deployment Section */}
                <div className="mt-16 border-t border-zinc-800 pt-12">
                    <h3 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                        Hardware Deployment & Reliability
                    </h3>

                    <div className="grid lg:grid-cols-[3fr_2fr] gap-12 items-center">
                        {/* Video Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Video 1: Walking */}
                            <div className="relative aspect-[9/16] rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
                                <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                                    <source src="/assets/hardware_walking.mp4" type="video/mp4" />
                                </video>
                                <div className="absolute top-4 left-4 right-4 bg-black/80 backdrop-blur-sm px-4 py-3 rounded border-l-4 border-green-500">
                                    <h4 className="font-bold text-sm text-white">Sim-to-Real</h4>
                                    <p className="text-[10px] text-gray-400">0.7 m/s stable gait</p>
                                </div>
                            </div>

                            {/* Video 2: Startup */}
                            <div className="relative aspect-[9/16] rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
                                <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                                    <source src="/assets/hardware_startup_v2.mp4" type="video/mp4" />
                                </video>
                                <div className="absolute top-4 left-4 right-4 bg-black/80 backdrop-blur-sm px-4 py-3 rounded border-l-4 border-yellow-500">
                                    <h4 className="font-bold text-sm text-white">Initialization</h4>
                                    <p className="text-[10px] text-gray-400">Startup sequence</p>
                                </div>
                            </div>
                        </div>

                        {/* Description Text */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-xl font-bold text-white">System Reliability & Zero-Shot Transfer</h4>
                                <p className="text-gray-300 leading-relaxed text-sm">
                                    Achieving reliable hardware performance required rigorous verification. The initialization sequence ensures all actuators are calibrated and within safety limits before control authority is handed over to the policy.
                                </p>
                            </div>

                            <div className="bg-zinc-900 p-6 rounded-lg border border-green-900/30">
                                <h4 className="text-lg font-bold text-green-400 mb-2">Performance Metrics</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        Zero-shot transfer from Isaac Gym
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        Consistent 0.7 m/s velocity tracking
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        &lt; 5% tracking error on flat ground
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hardware Challenges - 3 Legged */}
                <div className="mt-16 border-t border-zinc-800 pt-12">
                    <h3 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        Hardware Challenges & Adaptive Control
                    </h3>

                    <div className="space-y-6 mb-8 max-w-4xl">
                        <p className="text-gray-300 leading-relaxed">
                            Hardware failures are inevitable in robotics. During a critical testing phase, <strong>one of the rear motors burnt out</strong>, rendering the leg useless.
                        </p>
                        <div className="bg-zinc-900 p-6 rounded-lg border border-red-900/30">
                            <h4 className="text-lg font-bold text-red-400 mb-2">The Solution: Morphology Adaptation</h4>
                            <p className="text-sm text-gray-400">
                                Instead of halting development, I modified the robot's <strong>XML configuration</strong> to reflect a 3-legged morphology. I then retrained the PPO policy to discover a new locomotion strategy.
                            </p>
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                            The agent successfully learned a <span className="text-white font-bold">dynamic hopping gait</span> to compensate for the missing limb, capable of both recovery and high-speed traversal.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* Simulation */}
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
                            <Image
                                src="/assets/sim_3leg.gif"
                                alt="3-Legged Simulation"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded border-l-4 border-indigo-500">
                                <h4 className="font-bold text-lg text-white">Simulation Training</h4>
                                <p className="text-xs text-gray-400">Learning asymmetric gait</p>
                            </div>
                        </div>

                        {/* Hardware Validation */}
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 shadow-2xl shadow-red-900/10">
                            <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                                <source src="/assets/hardware_3leg.mp4" type="video/mp4" />
                            </video>
                            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded border-l-4 border-red-500">
                                <h4 className="font-bold text-lg text-white">Hardware Validation</h4>
                                <p className="text-xs text-gray-400">Successful Sim-to-Real transfer</p>
                            </div>
                        </div>
                    </div>

                    {/* 3 Legged High Speed */}
                    <div className="bg-zinc-900/50 p-6 rounded-lg border border-red-900/20">
                        <div className="grid lg:grid-cols-2 gap-8 items-center">
                            <div className="order-2 lg:order-1 relative aspect-video rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
                                <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                                    <source src="/assets/hardware_line.mp4" type="video/mp4" />
                                </video>
                                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded border-l-4 border-blue-500">
                                    <h4 className="font-bold text-lg text-white">High-Speed 3-Legged Run</h4>
                                    <p className="text-xs text-gray-400">Line following with missing limb</p>
                                </div>
                            </div>
                            <div className="order-1 lg:order-2">
                                <h4 className="text-xl font-bold text-white mb-2">Pushing the Limits</h4>
                                <p className="text-gray-400 text-sm">
                                    Further testing demonstrated that the 3-legged policy wasn't just a recovery mode—it retained high-performance capabilities, including <span className="text-red-400">high-speed line following</span> and sharp turning dynamics despite the asymmetry.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Digital Twin Section */}
                <div className="mt-16 border-t border-zinc-800 pt-12">
                    <h3 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        Real-time Visualization & Telemetry
                    </h3>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 shadow-2xl shadow-blue-900/10 order-2 md:order-1">
                            <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                                <source src="/assets/hardware_software_viz.mp4" type="video/mp4" />
                            </video>
                            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded border-l-4 border-blue-500">
                                <h4 className="font-bold text-lg text-white">Digital Twin</h4>
                                <p className="text-xs text-gray-400">Real-time hardware mirroring</p>
                            </div>
                        </div>

                        <div className="space-y-6 order-1 md:order-2">
                            <div className="bg-zinc-900 p-6 rounded-lg border border-blue-900/30">
                                <h4 className="text-lg font-bold text-blue-400 mb-2">State Estimation Verification</h4>
                                <p className="text-sm text-gray-400">
                                    To validate the robot's internal state estimation, I developed a <strong>real-time visualization pipeline</strong>. This creates a "digital twin" that mirrors the hardware's joint angles and base orientation instantaneously.
                                </p>
                            </div>
                            <p className="text-gray-300 leading-relaxed">
                                This tool was crucial for <span className="text-white font-bold">debugging sensor drift</span> and verifying that the policy's understanding of the robot's state matched physical reality.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section >
    );
}
