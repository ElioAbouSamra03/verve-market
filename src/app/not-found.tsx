import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-sm text-ink/40">404</p>
      <h1 className="mt-3 font-display text-3xl text-ink">We couldn't find that page</h1>
      <p className="mt-3 max-w-md text-sm text-ink/60">
        The page you're looking for may have been moved, renamed, or doesn't exist. Try heading
        back to the catalog.
      </p>
      <Link href="/products" className="mt-8">
        <Button size="lg">Browse products</Button>
      </Link>
    </div>
  );
}
