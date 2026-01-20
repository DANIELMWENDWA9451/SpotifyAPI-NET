import { useQuery } from '@tanstack/react-query';
import { User, ExternalLink, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { userApi, isBackendConfigured } from '@/services/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const backendConfigured = isBackendConfigured();

  const { data: user } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userApi.getProfile,
    enabled: backendConfigured,
  });

  if (!backendConfigured) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <button className="px-4 py-2 text-muted-foreground hover:text-foreground font-bold text-sm transition-colors hover:scale-105">
          Sign up
        </button>
        <button className="px-8 py-3 bg-foreground text-background rounded-full font-bold text-sm hover:scale-105 transition-transform">
          Log in
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "flex items-center gap-2 p-1 pr-3 bg-surface-1 hover:bg-surface-2 rounded-full transition-colors",
          className
        )}>
          {user?.images?.[0]?.url ? (
            <img
              src={user.images[0].url}
              alt={user.display_name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center">
              <User className="h-4 w-4 text-foreground" />
            </div>
          )}
          <span className="text-sm font-bold">{user?.display_name || 'User'}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-surface-3 border-border">
        <DropdownMenuItem className="hover:bg-surface-4">
          <span>Account</span>
          <ExternalLink className="h-4 w-4 ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-surface-4">
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-surface-4">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="hover:bg-surface-4">
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}