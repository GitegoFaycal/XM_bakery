import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Croissant, ShoppingBag, Menu, X, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import Button from '../ui/Button.jsx';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-brand-100 text-brand-800' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
  }`;

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  const links = (
    <>
      <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>
        Home
      </NavLink>
      <NavLink to="/products" className={linkClass} onClick={() => setOpen(false)}>
        Shop
      </NavLink>
      <NavLink to="/orders" className={linkClass} onClick={() => setOpen(false)}>
        My Orders
      </NavLink>
      {isAuthenticated && (
        <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>
          Dashboard
        </NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="rounded-lg bg-brand-600 p-1.5 text-white">
            <Croissant className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-stone-900">
            XM Bakery
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">{links}</nav>

        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            className="relative rounded-lg p-2 text-stone-700 hover:bg-stone-100"
            aria-label={`Cart, ${count} items`}
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="hidden items-center gap-2 md:flex">
              <span className="flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-1.5 text-sm text-stone-700">
                <User className="h-4 w-4" />
                {user.name}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Sign up
              </Button>
            </div>
          )}

          <button
            className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-stone-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">{links}</nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-stone-200 pt-3">
            {isAuthenticated ? (
              <>
                <span className="flex items-center gap-1.5 px-3 text-sm text-stone-600">
                  <User className="h-4 w-4" /> {user.name}
                </span>
                <Button variant="secondary" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setOpen(false);
                    navigate('/login');
                  }}
                >
                  Login
                </Button>
                <Button
                  onClick={() => {
                    setOpen(false);
                    navigate('/register');
                  }}
                >
                  <LayoutDashboard className="h-4 w-4" /> Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
