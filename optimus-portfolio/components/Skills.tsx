export default function Skills() {
    const skillCategories = [
        {
            title: "Simulation & RL",
            skills: ["MuJoCo (MJX/JAX)", "Physics Engines", "Domain Randomization", "PPO", "Reward Design", "Sim-to-Real Transfer"]
        },
        {
            title: "Machine Learning",
            skills: ["PyTorch", "JAX", "Reinforcement Learning", "Policy Optimization"]
        },
        {
            title: "Programming",
            skills: ["Python (Advanced)", "C++", "Linux/Bash", "Git"]
        },
        {
            title: "Robotics & Tools",
            skills: ["ROS 2", "OpenCV", "SolidWorks", "PCB Design", "Kinematics & Dynamics"]
        }
    ];

    return (
        <section className="py-20 bg-zinc-900 border-t border-zinc-800">
            <div className="max-w-6xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-white mb-12 text-center">Technical Expertise</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {skillCategories.map((category, idx) => (
                        <div key={idx} className="bg-black/50 p-6 rounded-lg border border-zinc-800 hover:border-red-900/50 transition-colors">
                            <h3 className="text-red-500 font-semibold mb-4 text-lg">{category.title}</h3>
                            <ul className="space-y-2">
                                {category.skills.map((skill, sIdx) => (
                                    <li key={sIdx} className="text-gray-300 text-sm flex items-start gap-2">
                                        <span className="text-zinc-600 mt-1">›</span> {skill}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
