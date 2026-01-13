export default function OtherProjects() {
    const projects = [
        {
            title: "CATS Lab",
            role: "Summer Undergraduate Research",
            date: "July 2024 – August 2024",
            tech: "ROS 2 • OpenCV • Navigation",
            desc: "Developed an autonomous navigation system for a Ranger omnidirectional robot. Integrated vision-based obstacle avoidance and real-time sensor–motor communication."
        },
        {
            title: "AI Group Internship",
            role: "Project Assistant",
            date: "July 2023 – August 2023",
            tech: "C++ • Graph Search • Motion Planning",
            desc: "Implemented real-time C++ A* path-planning and control algorithms for AGVs in industrial factory settings. Integrated PLC/Ladder logic within a cross-functional team."
        },
        {
            title: "Custom RL Environments",
            role: "Personal Project",
            date: "Ongoing",
            tech: "PyTorch • Gymnasium • Physics",
            desc: "Created custom Gymnasium environments for experimenting with novel reward shaping techniques for pendulum systems."
        }
    ];

    return (
        <section className="py-20 bg-black text-white border-t border-zinc-900">
            <div className="max-w-6xl mx-auto px-6">
                <h2 className="text-3xl font-bold mb-12 text-center text-gray-200">Other Relevant Work</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {projects.map((proj, idx) => (
                        <div key={idx} className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 hover:border-red-900/40 transition-all hover:-translate-y-1">
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-white mb-1">{proj.title}</h3>
                                <div className="flex justify-between items-baseline text-sm">
                                    <p className="text-red-500 font-mono">{proj.role}</p>
                                    <p className="text-zinc-500 text-xs">{proj.date}</p>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-400 font-mono mb-4 px-2 py-1 bg-black/50 inline-block rounded border border-zinc-800">{proj.tech}</p>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {proj.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
