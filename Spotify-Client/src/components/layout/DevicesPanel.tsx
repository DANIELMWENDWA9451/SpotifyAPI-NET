import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Laptop2, Smartphone, Speaker, Tv, Car, Headphones, Check, Wifi, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playerApi, isBackendConfigured } from '@/services/api';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { useSpotifyPlayer } from '@/contexts/SpotifyPlayerContext';
import type { SpotifyDevice } from '@/types/spotify';

interface DevicesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const deviceIcons: Record<string, typeof Laptop2> = {
  Computer: Laptop2,
  Smartphone: Smartphone,
  Speaker: Speaker,
  TV: Tv,
  Automobile: Car,
  Unknown: Headphones,
};

function DeviceItem({ device, onSelect, isTransferring }: { 
  device: SpotifyDevice; 
  onSelect: () => void;
  isTransferring: boolean;
}) {
  const Icon = deviceIcons[device.type] || Headphones;

  return (
    <button
      onClick={onSelect}
      disabled={isTransferring}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-lg transition-all duration-200",
        device.is_active 
          ? "bg-surface-2 text-primary" 
          : "hover:bg-surface-2/50 text-foreground",
        isTransferring && "opacity-50 cursor-wait"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
        device.is_active ? "bg-primary text-primary-foreground" : "bg-surface-3"
      )}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium">{device.name}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {device.type}
          {device.volume_percent !== undefined && ` • ${device.volume_percent}%`}
        </p>
      </div>
      {device.is_active && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <Check className="h-5 w-5 text-primary" />
        </div>
      )}
    </button>
  );
}

function WebPlayerItem({ 
  isActive, 
  isReady, 
  isPremium, 
  onSelect, 
  isTransferring 
}: { 
  isActive: boolean;
  isReady: boolean;
  isPremium: boolean;
  onSelect: () => void;
  isTransferring: boolean;
}) {
  if (!isPremium) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Monitor className="h-6 w-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-amber-200">Web Player</p>
          <p className="text-xs text-amber-500/80">Requires Spotify Premium</p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onSelect}
      disabled={isTransferring || !isReady}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-lg transition-all duration-200",
        isActive 
          ? "bg-primary/20 text-primary border border-primary/30" 
          : isReady 
            ? "hover:bg-surface-2/50 text-foreground border border-transparent"
            : "opacity-50 cursor-not-allowed border border-transparent",
        isTransferring && "opacity-50 cursor-wait"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
        isActive ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-primary/30 to-primary/10"
      )}>
        <Wifi className="h-6 w-6" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium">This Web Browser</p>
        <p className="text-xs text-muted-foreground">
          {isActive ? 'Currently playing' : isReady ? 'Ready to play' : 'Initializing...'}
        </p>
      </div>
      {isActive && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <Check className="h-5 w-5 text-primary" />
        </div>
      )}
    </button>
  );
}

export function DevicesPanel({ isOpen, onClose }: DevicesPanelProps) {
  const [isTransferring, setIsTransferring] = useState(false);
  const backendConfigured = isBackendConfigured();
  
  const { 
    isReady: webPlayerReady, 
    isActive: webPlayerActive, 
    isPremium,
    deviceId: webPlayerDeviceId,
    transferPlayback: transferToWebPlayer 
  } = useSpotifyPlayer();

  const { data: devices, isLoading, refetch } = useQuery({
    queryKey: ['devices'],
    queryFn: playerApi.getDevices,
    enabled: backendConfigured && isOpen,
    refetchInterval: 5000,
  });

  const handleTransferPlayback = async (deviceId: string) => {
    if (!backendConfigured) return;
    
    setIsTransferring(true);
    try {
      await playerApi.transferPlayback([deviceId], true);
      await refetch();
    } catch (error) {
      console.error('Failed to transfer playback:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleTransferToWebPlayer = async () => {
    if (!webPlayerDeviceId) return;
    
    setIsTransferring(true);
    try {
      await transferToWebPlayer(true);
      await refetch();
    } catch (error) {
      console.error('Failed to transfer to web player:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  // Filter out web player from device list if it exists
  const otherDevices = devices?.filter(d => d.id !== webPlayerDeviceId) ?? [];

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-y-0 right-0 w-[380px] bg-surface-1 border-l border-border z-50 flex flex-col",
      "animate-slide-in-right"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="font-bold text-lg">Connect to a device</h2>
          <p className="text-sm text-muted-foreground">Select a device to play on</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-surface-2 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!backendConfigured ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Laptop2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm">
              Connect backend to view devices
            </p>
          </div>
        ) : (
          <AnimatedContainer animation="fade-in">
            <div className="space-y-4">
              {/* Web Player Section */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  This Browser
                </h3>
                <WebPlayerItem
                  isActive={webPlayerActive}
                  isReady={webPlayerReady}
                  isPremium={isPremium}
                  onSelect={handleTransferToWebPlayer}
                  isTransferring={isTransferring}
                />
              </div>

              {/* Other Devices */}
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                      <div className="w-12 h-12 bg-surface-3 rounded-full animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-surface-3 rounded animate-pulse mb-1" />
                        <div className="h-3 w-20 bg-surface-3 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : otherDevices.length > 0 ? (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    Other Devices
                  </h3>
                  <div className="space-y-2">
                    {otherDevices.map((device) => (
                      <DeviceItem 
                        key={device.id} 
                        device={device}
                        onSelect={() => handleTransferPlayback(device.id)}
                        isTransferring={isTransferring}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Laptop2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No other devices found
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Open Spotify on another device to see it here
                  </p>
                </div>
              )}
            </div>
          </AnimatedContainer>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="bg-surface-2 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">Don't see your device?</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Make sure Spotify is open on the device</li>
            <li>• Make sure you're logged in to the same account</li>
            <li>• Spotify Premium is required for remote playback</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
