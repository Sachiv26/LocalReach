import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileNav } from "@/components/layout/mobile-nav";

/** Standard chrome for marketing / public marketplace pages. */
export function PubShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <MobileNav />
      <SiteFooter />
    </>
  );
}