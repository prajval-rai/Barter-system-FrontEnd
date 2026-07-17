import Navbar from '@/components/NavBar/NavBar';
import Hero from '@/components/Home/Hero/Hero';
import WhyBuilt from '@/components/Home/WhyBuilt/WhyBuilt';
import HowItWorks from '@/components/Home/HowItWorks/HowItWorks';
import WhyExchange from '@/components/Home/WhyExchange/WhyExchange';
import FAQ from '@/components/Home/FAQ/FAQ';
import Stats from '@/components/Home/Stats/Stats';
import CTA from '@/components/Home/CTA/CTA';
import Footer from '@/components/Footer/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <WhyBuilt />
        <WhyExchange />
        <FAQ />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
