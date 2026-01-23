import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SpotifyPlayerProvider } from "@/contexts/SpotifyPlayerContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Search from "./pages/Search";
import Library from "./pages/Library";
import Playlist from "./pages/Playlist";
import Album from "./pages/Album";
import Artist from "./pages/Artist";
import Login from "./pages/Login";
import Genre from "./pages/Genre";
import Show from "./pages/Show";
import Episode from "./pages/Episode";
import Queue from "./pages/Queue";
import LikedSongs from "./pages/LikedSongs";
import Recommendations from "./pages/Recommendations";
import Browse from "./pages/Browse";
import RecentlyPlayed from "./pages/RecentlyPlayed";
import NewReleases from "./pages/NewReleases";
import TopCharts from "./pages/TopCharts";
import NotFound from "./pages/NotFound";

// Configure React Query with balanced caching settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      staleTime: 1000 * 60 * 2, // Data stays fresh for 2 minutes (reduced from 5)
      gcTime: 1000 * 60 * 30, // Cache garbage collection after 30 minutes
      refetchOnMount: true, // Refetch on component mount if stale
      refetchOnReconnect: true, // Refetch when network reconnects
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SpotifyPlayerProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<MainLayout><Outlet /></MainLayout>}>
                <Route path="/" element={<Index />} />
                <Route path="/search" element={<Search />} />
                <Route path="/search/:query" element={<Search />} />
                <Route path="/library" element={<Library />} />
                <Route path="/library/:section" element={<Library />} />
                <Route path="/playlist/:id" element={<Playlist />} />
                <Route path="/album/:id" element={<Album />} />
                <Route path="/artist/:id" element={<Artist />} />
                <Route path="/genre/:id" element={<Genre />} />
                <Route path="/show/:id" element={<Show />} />
                <Route path="/episode/:id" element={<Episode />} />
                <Route path="/queue" element={<Queue />} />
                <Route path="/collection/tracks" element={<LikedSongs />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/browse/new-releases" element={<NewReleases />} />
                <Route path="/browse/charts" element={<TopCharts />} />
                <Route path="/recently-played" element={<RecentlyPlayed />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </SpotifyPlayerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
