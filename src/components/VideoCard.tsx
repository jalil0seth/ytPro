import React from 'react';
import { Heart } from 'lucide-react';
import { VideoItem, FavoriteVideo } from '../types';

interface VideoCardProps {
  video: VideoItem;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  searchTerm?: string;
  filters?: {
    includedTerms: string[];
    excludedTerms: string[];
  };
}

export function VideoCard({ video, isFavorite, onToggleFavorite, searchTerm, filters }: VideoCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const hasArabicText = (text: string) => {
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
  };

  return (
    <div className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <a
          href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <img
            src={video.snippet.thumbnails.medium.url}
            alt={video.snippet.title}
            className="w-full object-cover aspect-video group-hover:brightness-90 transition-all duration-300"
          />
        </a>
        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-all duration-300"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`}
            />
          </button>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <a
          href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <h3 className={`text-lg font-semibold line-clamp-2 mb-2 ${
            hasArabicText(video.snippet.title) ? 'text-right' : 'text-left'
          }`}>
            {video.snippet.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2 font-medium">
            {video.snippet.channelTitle}
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(video.snippet.publishedAt)}
          </p>
          <p className={`text-sm text-gray-700 mt-2 line-clamp-2 ${
            hasArabicText(video.snippet.description) ? 'text-right' : 'text-left'
          }`}>
            {video.snippet.description}
          </p>
        </a>
      </div>
    </div>
  );
}