import Navbar from "@/components/layout/Navbar";
import BottomTabBar from "@/components/layout/BottomTabBar";
import Hero from "@/components/landing/Hero";
import LandingClient from "@/components/landing/LandingClient";

export default function RootPage() {
  return (
    <>
      <Navbar />
      <div className="md:pt-16 pb-20 md:pb-0">
        <Hero />
        <LandingClient />
      </div>
      <BottomTabBar />
    </>
  );
}
