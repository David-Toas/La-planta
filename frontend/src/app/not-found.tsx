import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-28 pb-16">
        <span className="font-serif text-6xl text-primary font-bold">404</span>
        <h1 className="font-serif text-2xl text-primary font-semibold mt-2">
          Page Not Found
        </h1>
        <p className="text-sm text-on-surface-variant max-w-md mt-2">
          The luxury route or service you requested could not be located.
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2.5 rounded-lg bg-primary text-white text-xs uppercase tracking-wider font-semibold hover:bg-secondary transition-all"
        >
          Return to Homepage
        </Link>
      </main>
      <Footer />
    </div>
  );
}
