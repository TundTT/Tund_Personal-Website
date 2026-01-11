import Hero from '@/components/Hero';
import About from '@/components/About';
import FeaturedProject from '@/components/FeaturedProject';
import OtherProjects from '@/components/OtherProjects';
import Skills from '@/components/Skills';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-red-900 selection:text-white">
      <Hero />
      <About />
      <FeaturedProject />
      <OtherProjects />
      <Skills />
      <Footer />
    </main>
  );
}
