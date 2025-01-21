import React from 'react';
import { VideoItem } from '../types';

interface VideoCardProps {
  video: VideoItem;
}

export function VideoCard({ video }: VideoCardProps) {
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
    <div className="flex flex-col bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <a
        href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={video.snippet.thumbnails.medium.url}
          alt={video.snippet.title}
          className="w-full object-cover aspect-video"
        />
        <div className="p-4">
          <h3 className={`text-lg font-semibold line-clamp-2 mb-2 ${
            hasArabicText(video.snippet.title) ? 'text-right' : 'text-left'
          }`}>
            {video.snippet.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
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
        </div>
      </a>
    </div>
  );
}