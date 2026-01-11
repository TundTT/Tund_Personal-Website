export default function OtherProjects() {
    const projects = [
        {
            title: "Ranger Omnidirectional Robot",
            org: "CATS Lab",
            tech: "ROS 2 • OpenCV • Navigation",
            desc: "Designed holistic navigation stack for omnidirectional platform. Integrated vision-based obstacle avoidance.",
            link: "https://twitter.com/spacex/status/1792613580436852960" // Placeholder, should be repo or video if available
        },
        {
            title: "Path Planning for Industrial AGVs",
            org: "AI Group Internship",
            tech: "C++ • Graph Search • Motion Planning",
            desc: "Optimized A* algorithm for multi-agent path finding in dynamic warehouse environments. Reduced compute time by 30%.",
            link: "https://www.youtube.com/watch?v=Cp215gZt1I4" // Placeholder
        },
        {
            title: "Custom RL Environments",
            org: "Personal Project",
            tech: "PyTorch • Gymnasium • Physics",
            desc: "Created custom Gymnasium environments for experimenting with novel reward shaping techniques for pendulum systems.",
            link: "https://github.com/TundTT" // Placeholder
        }
    ];

    return (
        <section className="py-20 bg-black text-white border-t border-zinc-900">
            <div className="max-w-6xl mx-auto px-6">
                <h2 className="text-3xl font-bold mb-12 text-center text-gray-200">Other Relevant Work</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {projects.map((proj, idx) => (
                        <div key={idx} className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 hover:border-red-900/40 transition-all hover:-translate-y-1">
                            <h3 className="text-xl font-bold text-white mb-1">{proj.title}</h3>
                            <p className="text-red-500 text-sm font-mono mb-3">{proj.org}</p>
                            <p className="text-xs text-zinc-400 font-mono mb-4 px-2 py-1 bg-black/50 inline-block rounded border border-zinc-800">{proj.tech}</p>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                {proj.desc}
                            </p>
                            <a href={proj.link} target="_blank" className="text-sm font-semibold text-white hover:text-red-500 flex items-center gap-2 transition-colors">
                                View Project <span>→</span>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
