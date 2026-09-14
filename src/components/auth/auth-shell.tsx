import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileNav } from "@/components/layout/mobile-nav";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="container-page flex min-h-[70vh] items-center justify-center py-10">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {children}
          </div>
        </div>
      </main>
      <MobileNav />
      <SiteFooter />
    </>
  );
}