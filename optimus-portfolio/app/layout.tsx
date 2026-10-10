import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tund Theerawit | Robotics, Design & Learned Control",
  description:
    "Mechanical engineering and robot learning at UW–Madison. Explore QuadMorph morphing wheels and test-drive a trained humanoid policy in the PAL Playground.",
  keywords: [
    "Robotics",
    "Simulation",
    "MuJoCo",
    "Reinforcement Learning",
    "Humanoid Robotics",
    "Pupper",
    "Sim-to-Real",
  ],
  openGraph: {
    title: "Tund Theerawit | Making robots move in the real world",
    description:
      "Mechanical design, reinforcement learning, and real hardware. Explore the projects and try a trained K1 walking policy.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
