import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { PWAInstaller } from '@/components/ui/pwa-installer';
import { ScrollProgress } from '@/components/ui/scroll-progress';
import { MobileWrapper } from '@/components/layout/mobile-wrapper';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <ScrollProgress />
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>
      {/* Mobile Components */}
      <MobileWrapper />

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Desktop Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>

      <PWAInstaller />
    </div>
  );
}
