export interface VideoItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
    };
  };
  channelTitle: string;
  publishedAt: string;
  };
}

export interface SearchResponse {
  items: VideoItem[];
  nextPageToken?: string;
}

export interface FavoriteVideo extends VideoItem {
  searchTerm: string;
  filters: {
    includedTerms: string[];
    excludedTerms: string[];
  };
}

export interface SearchHistory {
  term: string;
  timestamp: number;
}