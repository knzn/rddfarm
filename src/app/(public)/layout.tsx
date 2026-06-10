import Navbar from "@/components/layout/Navbar";
import BottomTabBar from "@/components/layout/BottomTabBar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="md:pt-16 pb-20 md:pb-0">
        {children}
      </div>
      <BottomTabBar />
    </>
  );
}
