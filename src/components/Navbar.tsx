
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutGrid, Receipt, Package2, Settings } from 'lucide-react';
import { useStoreSettings } from '@/lib/db';

const Navbar = () => {
  const location = useLocation();
  const { storeInfo } = useStoreSettings();
  const [scrolled, setScrolled] = useState(false);
  
  // Change navbar shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const navLinks = [
    { path: '/', label: 'Dashboard', icon: <LayoutGrid className="h-4 w-4 mr-2" /> },
    { path: '/billing', label: 'Billing', icon: <Receipt className="h-4 w-4 mr-2" /> },
    { path: '/inventory', label: 'Inventory', icon: <Package2 className="h-4 w-4 mr-2" /> },
    { path: '/settings', label: 'Settings', icon: <Settings className="h-4 w-4 mr-2" /> }
  ];
  
  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md transition-shadow duration-200",
        scrolled ? "shadow-sm" : "shadow-none"
      )}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-primary font-medium text-lg transition-opacity hover:opacity-90"
            >
              <span className="bg-primary text-primary-foreground p-1 rounded">RB</span>
              <span>{storeInfo?.name || "Retail Billing"}</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-1">
            {navLinks.map(({ path, label, icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  "nav-link inline-flex items-center",
                  location.pathname === path && "nav-link-active"
                )}
              >
                {icon}
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          
          <div className="flex md:hidden">
            {/* Mobile menu - simplified for mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around px-2 py-2 z-40">
              {navLinks.map(({ path, label, icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-md transition-colors",
                    location.pathname === path 
                      ? "text-primary bg-primary/5" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {icon}
                  <span className="text-xs mt-1">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
