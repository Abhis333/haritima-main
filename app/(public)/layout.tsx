import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingChat } from "@/components/FloatingChat";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main" className="min-h-[70vh]">
        {children}
      </main>
      <Footer />
      <FloatingChat />
    </>
  );
}
