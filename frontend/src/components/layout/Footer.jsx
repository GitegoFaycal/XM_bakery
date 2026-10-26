import { Link } from 'react-router-dom';
import { Croissant } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-stone-500 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Croissant className="h-4 w-4 text-brand-600" />
          <span>XM Bakery · Baked fresh every morning</span>
        </div>
        <nav className="flex gap-4">
          <Link to="/products" className="hover:text-stone-800">
            Shop
          </Link>
          <Link to="/cart" className="hover:text-stone-800">
            Cart
          </Link>
          <Link to="/dashboard" className="hover:text-stone-800">
            Dashboard
          </Link>
        </nav>
        <p>&copy; {new Date().getFullYear()} XM Bakery</p>
      </div>
    </footer>
  );
}
