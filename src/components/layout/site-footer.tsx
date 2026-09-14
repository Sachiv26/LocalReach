import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-white">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-base font-bold text-gray-900">
            Local<span className="text-brand-600">Reach</span>
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Your neighbourhood. Your marketplace.
          </p>
          <p className="mt-3 text-xs text-gray-400">
            LocalReach is a marketplace platform and does not guarantee sellers,
            buyers, products or transactions. Always perform your own due
            diligence.
          </p>
        </div>
        <nav aria-label="Marketplace">
          <p className="text-sm font-semibold text-gray-900">Marketplace</p>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href="/ads" className="hover:text-brand-700">Browse adverts</Link></li>
            <li><Link href="/businesses" className="hover:text-brand-700">Business directory</Link></li>
            <li><Link href="/search" className="hover:text-brand-700">Search</Link></li>
            <li><Link href="/pricing" className="hover:text-brand-700">Pricing</Link></li>
          </ul>
        </nav>
        <nav aria-label="Communities">
          <p className="text-sm font-semibold text-gray-900">Communities</p>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>
              <Link href="/community/umgeni-park-durban-north" className="hover:text-brand-700">
                Umgeni Park &amp; Durban North
              </Link>
            </li>
            <li>
              <Link href="/community/umgeni-park-durban-north/rules" className="hover:text-brand-700">
                Community rules
              </Link>
            </li>
            <li><Link href="/admin/partnership" className="hover:text-brand-700">For community admins</Link></li>
          </ul>
        </nav>
        <nav aria-label="Trust and legal">
          <p className="text-sm font-semibold text-gray-900">Trust &amp; legal</p>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href="/safety" className="hover:text-brand-700">Safety &amp; buyer beware</Link></li>
            <li><Link href="/community-rules" className="hover:text-brand-700">Community rules</Link></li>
            <li><Link href="/terms" className="hover:text-brand-700">Terms of service</Link></li>
            <li><Link href="/privacy" className="hover:text-brand-700">Privacy policy</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-gray-100 py-4">
        <p className="container-page text-center text-xs text-gray-400">
          © {new Date().getFullYear()} LocalReach · Made for South African
          communities 🇿🇦
        </p>
      </div>
    </footer>
  );
}
