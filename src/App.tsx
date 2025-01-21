import React, { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { VideoCard } from './components/VideoCard';
import { VideoItem, SearchResponse } from './types';
import { Youtube, X, Plus } from 'lucide-react';

const API_KEY = 'AIzaSyBU4PD2kWZEKvy5dOYUDpTvjACWvBq4hPo';
const API_URL = 'https://www.googleapis.com/youtube/v3/search';

// Default terms
const DEFAULT_INCLUDED_TERMS = ['method', 'مشكلة', 'شرح'];
const DEFAULT_EXCLUDED_TERMS = ['paypal.me'];

function App() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Save terms to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('excludedTerms', JSON.stringify(excludedTerms));
  }, [excludedTerms]);

  useEffect(() => {
    localStorage.setItem('includedTerms', JSON.stringify(includedTerms));
  }, [includedTerms]);

  const shouldExcludeVideo = (video: VideoItem): boolean => {
    const titleToCheck = video.snippet.title.toLowerCase();
    return excludedTerms.some(term => titleToCheck.includes(term.toLowerCase()));
  };

  const hasIncludedTerm = (video: VideoItem): boolean => {
    if (includedTerms.length === 0) return true;
    const titleToCheck = video.snippet.title.toLowerCase();
    return includedTerms.some(term => titleToCheck.includes(term.toLowerCase()));
  };

  const isWithinLastThreeYears = (publishedAt: string): boolean => {
    const publishDate = new Date(publishedAt);
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    return publishDate >= threeYearsAgo;
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

  const searchVideos = async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    setVideos([]);

    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q: searchTerm,
        maxResults: '50',
        type: 'video',
        regionCode: 'MA',
        order: 'date',
        key: API_KEY,
      });

      const response = await fetch(`${API_URL}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch videos');
      
      const data: SearchResponse = await response.json();
      const filteredVideos = data.items
        .filter(video => 
          isWithinLastThreeYears(video.snippet.publishedAt) && 
          !shouldExcludeVideo(video) &&
          hasIncludedTerm(video)
        );
      setVideos(filteredVideos);
    } catch (err) {
      setError('Failed to load videos. Please try again later.');
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
              YouTube Morocco Search
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
            <p>Enter a search term to find videos from Morocco</p>
            <p className="text-sm mt-2 text-gray-500">
              Only showing videos from the last 3 years
            </p>
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
      </main>
    </div>
  );
}

export default App;