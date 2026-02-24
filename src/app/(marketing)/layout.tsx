import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#0A0A0A]">
      {/* Grain texture */}
      <div className="grain-overlay" />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
