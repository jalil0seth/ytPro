import React, { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { VideoCard } from './components/VideoCard';
import { VideoItem, SearchResponse } from './types';
import { Youtube, X, Plus } from 'lucide-react';

const API_KEY = 'AIzaSyBU4PD2kWZEKvy5dOYUDpTvjACWvBq4hPo';
const API_URL = 'https://www.googleapis.com/youtube/v3/search';

// Default terms
const DEFAULT_INCLUDED_TERMS = ['شرح', 'مشكلة', 'method'];
const DEFAULT_EXCLUDED_TERMS: string[] = [];

function App() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [excludedTerms, setExcludedTerms] = useState<string[]>(() => {
    const saved = localStorage.getItem('excludedTerms');
    return saved ? JSON.parse(saved) : DEFAULT_EXCLUDED_TERMS;
  });
  const [includedTerms, setIncludedTerms] = useState<string[]>(() => {
    const saved = localStorage.getItem('includedTerms');
    return saved ? JSON.parse(saved) : DEFAULT_INCLUDED_TERMS;
  });
  const [newExcludedTerm, setNewExcludedTerm] = useState('');
  const [newIncludedTerm, setNewIncludedTerm] = useState('');

  useEffect(() => {
    localStorage.setItem('excludedTerms', JSON.stringify(excludedTerms));
  }, [excludedTerms]);

  useEffect(() => {
    localStorage.setItem('includedTerms', JSON.stringify(includedTerms));
  }, [includedTerms]);

  const shouldExcludeVideo = (video: VideoItem): boolean => {
    if (excludedTerms.length === 0) return false;
    const title = video.snippet.title;
    return excludedTerms.some(term => title.includes(term));
  };

  const hasIncludedTerm = (video: VideoItem): boolean => {
    if (includedTerms.length === 0) return true;
    const title = video.snippet.title;
    return includedTerms.some(term => title.includes(term));
  };

  const addExcludedTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExcludedTerm.trim() && !excludedTerms.includes(newExcludedTerm.trim())) {
      setExcludedTerms([...excludedTerms, newExcludedTerm.trim()]);
      setNewExcludedTerm('');
    }
  };

  const addIncludedTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIncludedTerm.trim() && !includedTerms.includes(newIncludedTerm.trim())) {
      setIncludedTerms([...includedTerms, newIncludedTerm.trim()]);
      setNewIncludedTerm('');
    }
  };

  const removeExcludedTerm = (termToRemove: string) => {
    setExcludedTerms(excludedTerms.filter(term => term !== termToRemove));
  };

  const removeIncludedTerm = (termToRemove: string) => {
    setIncludedTerms(includedTerms.filter(term => term !== termToRemove));
  };

  const fetchVideos = async (searchTerm: string, pageToken?: string) => {
    try {
      // Build search query including any included terms
      let searchQuery = searchTerm;
      if (includedTerms.length > 0) {
        // Add OR operator for included terms
        searchQuery = `${searchTerm} (${includedTerms.join(' | ')})`;
      }

      const params = new URLSearchParams({
        part: 'snippet',
        q: searchQuery,
        maxResults: '50',
        type: 'video',
        order: 'date',
        key: API_KEY,
        relevanceLanguage: 'ar',
      });

      if (pageToken) {
        params.append('pageToken', pageToken);
      }

      const response = await fetch(`${API_URL}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch videos');
      
      const data: SearchResponse = await response.json();
      
      // Only apply exclude filter since include is handled in search query
      const filteredVideos = data.items.filter(video => !shouldExcludeVideo(video));
      return {
        videos: filteredVideos,
        nextPageToken: data.nextPageToken
      };
    } catch (err) {
      throw err;
    }
  };

  const searchVideos = async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    setVideos([]);
    setNextPageToken(undefined);
    setCurrentSearchTerm(searchTerm);

    try {
      const { videos: newVideos, nextPageToken: newNextPageToken } = await fetchVideos(searchTerm);
      setVideos(newVideos);
      setNextPageToken(newNextPageToken);
    } catch (err) {
      setError('Failed to load videos. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextPageToken || loading || !currentSearchTerm) return;

    setLoading(true);
    try {
      const { videos: newVideos, nextPageToken: newNextPageToken } = await fetchVideos(currentSearchTerm, nextPageToken);
      setVideos(prevVideos => [...prevVideos, ...newVideos]);
      setNextPageToken(newNextPageToken);
    } catch (err) {
      setError('Failed to load more videos. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 mb-8 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Youtube className="w-8 h-8 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              YouTube Search
            </h1>
          </div>
          <SearchBar onSearch={searchVideos} />
          
          <div className="mt-4 space-y-4">
            {/* Include Terms Section */}
            <div>
              <h2 className="text-lg font-semibold text-center mb-2">Include Terms</h2>
              <form onSubmit={addIncludedTerm} className="flex gap-2 max-w-md mx-auto mb-2">
                <input
                  type="text"
                  value={newIncludedTerm}
                  onChange={(e) => setNewIncludedTerm(e.target.value)}
                  placeholder="Add term to include in titles..."
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:border-green-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
              
              {includedTerms.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                  {includedTerms.map((term) => (
                    <div
                      key={term}
                      className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full"
                    >
                      <span className="text-sm text-green-700">{term}</span>
                      <button
                        onClick={() => removeIncludedTerm(term)}
                        className="text-green-500 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exclude Terms Section */}
            <div>
              <h2 className="text-lg font-semibold text-center mb-2">Exclude Terms</h2>
              <form onSubmit={addExcludedTerm} className="flex gap-2 max-w-md mx-auto mb-2">
                <input
                  type="text"
                  value={newExcludedTerm}
                  onChange={(e) => setNewExcludedTerm(e.target.value)}
                  placeholder="Add term to exclude from titles..."
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
              
              {excludedTerms.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                  {excludedTerms.map((term) => (
                    <div
                      key={term}
                      className="flex items-center gap-1 bg-red-50 px-3 py-1 rounded-full"
                    >
                      <span className="text-sm text-red-700">{term}</span>
                      <button
                        onClick={() => removeExcludedTerm(term)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-8">
        {error && (
          <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!loading && !error && videos.length === 0 && (
          <div className="text-center text-gray-600">
            <p>Enter a search term to find videos</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id.videoId} video={video} />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}

        {!loading && nextPageToken && videos.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;