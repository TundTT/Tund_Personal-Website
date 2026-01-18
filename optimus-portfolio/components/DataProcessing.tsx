import React from 'react';
import Image from 'next/image';

export default function DataProcessing() {
    return (
        <section className="py-20 bg-zinc-900 border-t border-zinc-800">
            <div className="max-w-6xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-white mb-16 text-center">Data Processing & Visualization</h2>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* WandB Card */}
                    <div className="group relative bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800 hover:border-[#FFBE00]/50 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FFBE00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                {/* WandB Logo Representation */}
                                <div className="relative w-12 h-12 rounded-lg bg-[#FFBE00]/10 flex items-center justify-center border border-[#FFBE00]/20 overflow-hidden">
                                    <Image
                                        src="/assets/wandb_logo.png"
                                        alt="WandB Logo"
                                        fill
                                        className="object-contain p-2"
                                        unoptimized
                                    />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Weights & Biases</h3>
                            </div>

                            <p className="text-gray-400 mb-6 leading-relaxed">
                                Leveraging <span className="text-[#FFBE00]">WandB</span> for comprehensive experiment tracking, hyperparameter sweeps, and model versioning.
                            </p>

                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-gray-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFBE00]" />
                                    Real-time training metrics monitoring
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFBE00]" />
                                    System resource usage profiling
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFBE00]" />
                                    Artifact versioning & reproducibility
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Foxglove Card */}
                    <div className="group relative bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800 hover:border-[#9C27B0]/50 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#9C27B0]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                {/* Foxglove Logo Representation */}
                                <div className="relative w-12 h-12 rounded-lg bg-[#9C27B0]/10 flex items-center justify-center border border-[#9C27B0]/20 overflow-hidden">
                                    <Image
                                        src="/assets/foxglove_logo.png"
                                        alt="Foxglove Logo"
                                        fill
                                        className="object-contain p-2"
                                        unoptimized
                                    />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Foxglove</h3>
                            </div>

                            <p className="text-gray-400 mb-6 leading-relaxed">
                                Utilizing <span className="text-[#9C27B0]">Foxglove Studio</span> for verification of sim-to-real transfer and real-time hardware telemetry inspection.
                            </p>

                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-gray-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#9C27B0]" />
                                    Complex 3D data visualization
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#9C27B0]" />
                                    Latency-critical state estimation
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#9C27B0]" />
                                    Multi-modal sensor fusion debugging
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
