import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-paddy-100 bg-paddy-50/60">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link to="/" className="font-display text-lg font-semibold text-paddy-800">
            రైతు సేతు
          </Link>
          <p className="text-xs text-ink-soft/60">
            &copy; {new Date().getFullYear()} Raithu Sethu — Bridging Farmers & Buyers
          </p>
        </div>
      </div>
    </footer>
  );
}
