import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Container from './Container';
import Button from '../common/Button';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Security', href: '#security' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-300
        ${isScrolled ? 'glass shadow-soft' : 'bg-transparent'}
      `}
      role="navigation"
      aria-label="Main navigation"
    >
      <Container>
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2 font-semibold text-lg text-charcoal-900"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-charcoal-900 text-cream-50 text-xs font-bold">
              LI
            </span>
            <span>LoanLens<span className="text-charcoal-400 font-normal ml-1">AI</span></span>
          </Link>

          {/* Desktop Links */}
          {isLanding && (
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-charcoal-600 hover:text-charcoal-900 transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to={ROUTES.APPLICANT}>
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={logout}>Sign Out</Button>
              </>
            ) : (
              <>
                <Link to={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to={ROUTES.APPLY}>
                  <Button variant="primary" size="sm">Start Application</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            type="button"
            className="md:hidden p-2 text-charcoal-700 hover:text-charcoal-900 transition-colors"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-expanded={isMobileOpen}
            aria-label="Toggle navigation menu"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden glass border-t border-cream-300/40">
          <Container>
            <div className="py-4 flex flex-col gap-2">
              {isLanding && NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="py-2 text-sm text-charcoal-600 hover:text-charcoal-900 transition-colors"
                  onClick={() => setIsMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-cream-300/40">
                {user ? (
                  <>
                    <Link to={ROUTES.APPLICANT} onClick={() => setIsMobileOpen(false)}>
                      <Button variant="primary" size="sm" className="w-full">Dashboard</Button>
                    </Link>
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => { logout(); setIsMobileOpen(false); }}>Sign Out</Button>
                  </>
                ) : (
                  <>
                    <Link to={ROUTES.LOGIN} onClick={() => setIsMobileOpen(false)}>
                      <Button variant="secondary" size="sm" className="w-full">Sign In</Button>
                    </Link>
                    <Link to={ROUTES.APPLY} onClick={() => setIsMobileOpen(false)}>
                      <Button variant="primary" size="sm" className="w-full">Start Application</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </Container>
        </div>
      )}
    </nav>
  );
}
