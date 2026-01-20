import { ReactNode, useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { PlayerBar } from './PlayerBar';
import { MobileNav } from './MobileNav';
import { UserMenu } from './UserMenu';
import { NowPlayingView } from './NowPlayingView';
import { QueuePanel } from './QueuePanel';
import { DevicesPanel } from './DevicesPanel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [activePanel, setActivePanel] = useState<'none' | 'queue' | 'devices' | 'nowPlaying' | 'lyrics'>(() => {
    // Check if panel was pinned on last visit
    const pinned = localStorage.getItem('lyricsPanelPinned');
    const lastPanel = localStorage.getItem('lastActivePanel');
    if (pinned === 'true' && (lastPanel === 'nowPlaying' || lastPanel === 'lyrics')) {
      return lastPanel as 'nowPlaying' | 'lyrics';
    }
    return 'none';
  });
  const [isPinned, setIsPinned] = useState(() => localStorage.getItem('lyricsPanelPinned') === 'true');
  const navigate = useNavigate();

  const handlePanelToggle = useCallback((panel: 'queue' | 'devices' | 'nowPlaying' | 'lyrics') => {
    setActivePanel(prev => {
      const newPanel = prev === panel ? 'none' : panel;
      // Save to localStorage if it's nowPlaying or lyrics
      if (newPanel === 'nowPlaying' || newPanel === 'lyrics') {
        localStorage.setItem('lastActivePanel', newPanel);
      }
      return newPanel;
    });
  }, []);

  const handleClosePanel = useCallback(() => {
    // If pinned and it's the lyrics/nowPlaying panel, don't close
    if (isPinned && (activePanel === 'nowPlaying' || activePanel === 'lyrics')) {
      return; // Don't close when pinned
    }
    setActivePanel('none');
  }, [isPinned, activePanel]);

  const handlePinToggle = useCallback(() => {
    setIsPinned(prev => {
      const newState = !prev;
      localStorage.setItem('lyricsPanelPinned', String(newState));
      return newState;
    });
  }, []);

  // Check if any panel is open
  const isPanelOpen = activePanel !== 'none';

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <Sidebar className="hidden md:flex flex-shrink-0" />

        {/* Main Content */}
        <main className={cn(
          "flex-1 min-w-0 overflow-hidden transition-all duration-300",
          isPanelOpen && "md:mr-[380px]"
        )}>
          <div className="h-full overflow-y-auto bg-gradient-to-b from-surface-2 to-background rounded-lg m-2">
            {/* Header with navigation */}
            <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-surface-2/95 to-surface-2/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(-1)}
                  className="w-8 h-8 rounded-full bg-surface-0/70 flex items-center justify-center hover:bg-surface-0 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate(1)}
                  className="w-8 h-8 rounded-full bg-surface-0/70 flex items-center justify-center hover:bg-surface-0 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <UserMenu />
            </header>
            {children}
          </div>
        </main>

        {/* Panels - Only one can be open at a time */}
        <NowPlayingView
          isOpen={activePanel === 'nowPlaying' || activePanel === 'lyrics'}
          onClose={handleClosePanel}
          onQueueClick={() => handlePanelToggle('queue')}
          initialTab={activePanel === 'lyrics' ? 'lyrics' : 'now-playing'}
          isPinned={isPinned}
          onPinToggle={handlePinToggle}
        />
        <QueuePanel
          isOpen={activePanel === 'queue'}
          onClose={handleClosePanel}
        />
        <DevicesPanel
          isOpen={activePanel === 'devices'}
          onClose={handleClosePanel}
        />
      </div>

      {/* Player Bar - Connected to panels */}
      <PlayerBar
        onQueueClick={() => handlePanelToggle('queue')}
        onDevicesClick={() => handlePanelToggle('devices')}
        onNowPlayingClick={() => handlePanelToggle('nowPlaying')}
        onLyricsClick={() => handlePanelToggle('lyrics')}
        activePanel={activePanel}
      />

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}