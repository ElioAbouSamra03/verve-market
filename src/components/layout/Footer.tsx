import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-sand/40">
      <div className="mx-auto grid max-w-content gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <p className="font-display text-lg text-ink">VerveMarket</p>
          <p className="mt-2 max-w-xs text-sm text-ink/60">
            A studio-made catalog of goods for people who like things that are built to last.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/60">
            <li><Link href="/products" className="hover:text-ink">All products</Link></li>
            <li><Link href="/categories/home" className="hover:text-ink">Home</Link></li>
            <li><Link href="/categories/kitchen" className="hover:text-ink">Kitchen</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Account</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/60">
            <li><Link href="/cart" className="hover:text-ink">Cart</Link></li>
            <li><Link href="/wishlist" className="hover:text-ink">Wishlist</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">About this project</p>
          <p className="mt-3 text-sm text-ink/60">
            Built as a full-stack architecture exercise: Next.js + TypeScript + DynamoDB.
          </p>
        </div>
      </div>
      <div className="border-t border-line px-4 py-4 text-center text-xs text-ink/40 sm:px-6">
        © {new Date().getFullYear()} VerveMarket. Built for demonstration purposes.
      </div>
    </footer>
  );
}
