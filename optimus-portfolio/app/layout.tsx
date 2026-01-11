import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tund Theerawit | Robotics & Simulation Engineer',
  description: 'Building High-Fidelity Simulations for Legged Robot Autonomy. Portfolio for Tesla Optimus Application.',
  keywords: ['Robotics', 'Simulation', 'MuJoCo', 'Reinforcement Learning', 'Tesla Optimus', 'Pupper', 'Sim-to-Real'],
  openGraph: {
    title: 'Tund Theerawit | Robotics & Simulation Engineer',
    description: 'High-Fidelity MuJoCo Simulations & Sim-to-Real Transfer',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
