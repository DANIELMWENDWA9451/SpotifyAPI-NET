import React, { useState } from 'react';
import { Play, Heart, MoreHorizontal, ChevronDown, Maximize2 } from 'lucide-react';

export default function LyricsPanel() {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-md">
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronDown className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-semibold tracking-wide">LYRICS</h2>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {/* Empty State */}
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="mb-6 relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
              <div className="w-28 h-28 rounded-full bg-gray-900 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/50">
              <span className="text-xs">♪</span>
            </div>
          </div>

          <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            No lyrics available
          </h3>
          <p className="text-gray-400 text-sm max-w-xs">
            Start playing a song to view lyrics and sing along
          </p>

          {/* Decorative Elements */}
          <div className="mt-12 flex gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>

      {/* Mini Player Footer */}
      <div className="bg-gradient-to-t from-black via-gray-900/95 to-transparent backdrop-blur-xl border-t border-white/5 p-4">
        <div className="flex items-center gap-4">
          {/* Album Art Placeholder */}
          <div className="w-14 h-14 rounded-md bg-gradient-to-br from-gray-700 to-gray-800 flex-shrink-0 shadow-lg"></div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-400 truncate">No song playing</h4>
            <p className="text-xs text-gray-500 truncate">Select a track to begin</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="p-2 hover:bg-white/5 rounded-full transition-all"
            >
              <Heart
                className={`w-5 h-5 transition-all ${isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}`}
              />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full w-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"></div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>0:00</span>
            <span>0:00</span>
          </div>
        </div>
      </div>
    </div>
  );
}