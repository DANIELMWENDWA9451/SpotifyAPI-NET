import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Plus, ImagePlus, Globe, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playlistApi, userApi, isBackendConfigured } from '@/services/api';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (playlistId: string) => void;
}

export function CreatePlaylistModal({ isOpen, onClose, onSuccess }: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendConfigured = isBackendConfigured();

  const { data: user } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userApi.getProfile,
    enabled: backendConfigured && isOpen,
  });

  const handleCreate = async () => {
    if (!backendConfigured || !user || !name.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const playlist = await playlistApi.createPlaylist(
        user.id,
        name.trim(),
        description.trim() || undefined,
        isPublic
      );
      
      onSuccess?.(playlist.id);
      handleClose();
    } catch (err) {
      setError('Failed to create playlist. Please try again.');
      console.error('Create playlist error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setIsPublic(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <AnimatedContainer animation="scale-in" className="relative w-full max-w-md mx-4">
        <div className="bg-surface-2 rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-xl font-bold">Create Playlist</h2>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-surface-3 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {!backendConfigured ? (
              <div className="text-center py-8">
                <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Connect backend to create playlists
                </p>
              </div>
            ) : (
              <>
                {/* Cover Image Placeholder */}
                <div className="flex justify-center">
                  <button className="w-40 h-40 rounded-lg bg-surface-3 flex flex-col items-center justify-center gap-2 hover:bg-surface-4 transition-colors group">
                    <ImagePlus className="h-8 w-8 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      Choose image
                    </span>
                  </button>
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Playlist #1"
                    className="bg-surface-3 border-0"
                    maxLength={100}
                  />
                </div>

                {/* Description Input */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add an optional description"
                    className="bg-surface-3 border-0 resize-none"
                    rows={3}
                    maxLength={300}
                  />
                </div>

                {/* Public Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isPublic ? (
                      <Globe className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {isPublic ? 'Public' : 'Private'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isPublic 
                          ? 'Anyone can search for and listen' 
                          : 'Only you can see this playlist'
                        }
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {backendConfigured && (
            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <button
                onClick={handleClose}
                className="px-6 py-2 font-bold text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || isCreating}
                className={cn(
                  "px-8 py-3 rounded-full font-bold text-sm transition-all",
                  "bg-primary text-primary-foreground hover:scale-105 active:scale-95",
                  (!name.trim() || isCreating) && "opacity-50 cursor-not-allowed hover:scale-100"
                )}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          )}
        </div>
      </AnimatedContainer>
    </div>
  );
}