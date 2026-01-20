import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Library } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Library, label: 'Your Library', path: '/library' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-background/90 border-t border-border md:hidden z-40">
      <div className="flex items-center justify-around py-3 px-4">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || 
            (path === '/library' && location.pathname.startsWith('/library'));

          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1 transition-all duration-200",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className={cn(
                "h-6 w-6 transition-transform",
                isActive && "scale-110"
              )} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}