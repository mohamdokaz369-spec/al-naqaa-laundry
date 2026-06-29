import Navbar from "./app/components/Navbar";
import Hero from "./app/components/Hero";
import Services from "./app/components/Services";
import WhyUs from "./app/components/WhyUs";
import PickupCTA from "./app/components/PickupCTA";
import Contact from "./app/components/Contact";
import Footer from "./app/components/Footer";
import WhatsAppButton from "./app/components/WhatsAppButton";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <WhyUs />
        <PickupCTA />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}