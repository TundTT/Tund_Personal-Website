export default function Footer() {
    return (
        <footer className="bg-black py-12 border-t border-zinc-900">
            <div className="max-w-5xl mx-auto px-6 text-center">
                <div className="flex flex-col items-center gap-6 mb-8">
                    <h2 className="text-2xl font-bold text-white">Let's Connect</h2>
                    <div className="flex gap-6">
                        <a href="https://www.linkedin.com/in/tund-theerawit-015054293/" target="_blank" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a>
                        <a href="https://github.com/TundTT" target="_blank" className="text-gray-400 hover:text-white transition-colors">GitHub</a>
                        <a href="mailto:Theerawit@wisc.edu" className="text-gray-400 hover:text-white transition-colors">Email</a>
                    </div>
                    <a
                        href="/Tund Theerawit Resume.pdf"
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-full text-sm transition-colors"
                        target="_blank"
                    >
                        Download Resume PDF
                    </a>
                </div>
                <p className="text-zinc-600 text-sm">
                    © {new Date().getFullYear()} Tund Theerawit. Built for the future of humanoid robotics.
                </p>
            </div>
        </footer>
    );
}
