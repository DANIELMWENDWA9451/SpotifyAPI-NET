import { useState } from 'react';
import { Music, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isBackendConfigured, setToken } from '@/services/api';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const backendConfigured = isBackendConfigured();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for token in URL
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    if (token) {
      setToken(token); // Save token
      navigate('/', { replace: true }); // Redirect to home
    }
  }, [location, navigate]);

  const handleSpotifyLogin = async () => {
    if (!backendConfigured) return;

    setIsLoading(true);
    // Redirect to backend OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-8">
        <div className="flex items-center gap-2">
          <Music className="h-10 w-10 text-primary" />
          <span className="text-2xl font-bold">DanSpotify</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <AnimatedContainer animation="scale-in" className="w-full max-w-md">
          <div className="bg-surface-1 rounded-lg p-8 shadow-2xl">
            <h1 className="text-3xl font-bold text-center mb-8">
              Log in to Spotify
            </h1>

            {!backendConfigured ? (
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-6 animate-bounce-subtle">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">Waiting for Backend</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Configure your backend URL to enable authentication.
                </p>
                <div className="bg-surface-2 rounded-lg p-4 text-left">
                  <p className="text-xs text-muted-foreground mb-2">Set environment variable:</p>
                  <code className="text-sm text-foreground break-all">
                    VITE_API_BASE_URL=https://your-api.azurewebsites.net
                  </code>
                </div>
              </div>
            ) : (
              <>
                {/* Spotify OAuth Button */}
                <button
                  onClick={handleSpotifyLogin}
                  disabled={isLoading}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 py-4 px-6 rounded-full font-bold text-lg transition-all duration-200",
                    "bg-primary text-primary-foreground hover:bg-spotify-green-light hover:scale-[1.02] active:scale-[0.98]",
                    isLoading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Music className="h-5 w-5" />
                      Continue with Spotify
                    </>
                  )}
                </button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-surface-1 px-4 text-muted-foreground">
                      Spotify Premium Required
                    </span>
                  </div>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  By clicking continue, you agree to Spotify's{' '}
                  <a href="https://www.spotify.com/legal/end-user-agreement/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="https://www.spotify.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                    Privacy Policy
                  </a>
                  .
                </p>
              </>
            )}
          </div>
        </AnimatedContainer>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center text-xs text-muted-foreground">
        <p>This app uses Spotify's official API. A Spotify account is required.</p>
      </footer>
    </div>
  );
}