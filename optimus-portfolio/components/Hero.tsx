export default function Hero() {
    return (
        <section className="relative h-screen w-full overflow-hidden bg-black text-white flex flex-col items-center justify-center">
            {/* Background Video/GIF */}
            <div className="absolute inset-0 z-0 opacity-40">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="object-cover w-full h-full"
                    poster="/assets/pupperwalkdomain.mp4"
                >
                    <source src="/assets/pupperwalkdomain.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                <h2 className="text-xl md:text-2xl font-medium text-gray-200 mb-6 animate-fade-in-up">
                    Hi, I'm <span className="text-white font-bold">Tund Theerawit</span>
                </h2>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 animate-fade-in-up delay-200">
                    Building High-Fidelity Simulations for <span className="text-red-600">Legged Robot Autonomy</span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                    Mechanical Engineering @ UW-Madison ’27 | MuJoCo (MJX/JAX) • PPO • Domain Randomization • Sim-to-Real Transfer
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <a
                        href="#featured-project"
                        className="bg-white text-black hover:bg-gray-200 font-semibold py-3 px-8 rounded-full transition-colors duration-300 text-lg"
                    >
                        View Simulation Work
                    </a>
                    <a
                        href="/resume.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-2 border-white text-white hover:bg-white hover:text-black font-semibold py-3 px-8 rounded-full transition-colors duration-300 text-lg"
                    >
                        Download Resume
                    </a>
                    <div className="flex gap-4 mt-4 sm:mt-0 sm:ml-4">
                        {/* Social Icons placeholders */}
                        <a href="https://github.com/TundTT" target="_blank" className="hover:text-red-500 transition-colors">GitHub</a>
                        <a href="https://www.linkedin.com/in/tund-theerawit-015054293/" target="_blank" className="hover:text-red-500 transition-colors">LinkedIn</a>
                    </div>
                </div>
            </div>
        </section>
    );
}
