import React, { useState, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { VideoCard } from './components/VideoCard';
import { VideoItem, SearchResponse, FavoriteVideo, SearchHistory } from './types';
import { Youtube, X, Plus, History, Heart, Search, Filter, Calendar, Tag, ChevronDown, ChevronUp } from 'lucide-react';

const API_KEY = 'AIzaSyBU4PD2kWZEKvy5dOYUDpTvjACWvBq4hPo';
const API_URL = 'https://www.googleapis.com/youtube/v3/search';

const DEFAULT_INCLUDED_TERMS = ['شرح', 'مشكلة', 'method'];
const DEFAULT_EXCLUDED_TERMS: string[] = [];

function App() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  const [excludedTerms, setExcludedTerms] = useState<string[]>(() => {
    const saved = localStorage.getItem('excludedTerms');
    return saved ? JSON.parse(saved) : DEFAULT_EXCLUDED_TERMS;
  });
  
  const [includedTerms, setIncludedTerms] = useState<string[]>(() => {
    const saved = localStorage.getItem('includedTerms');
    return saved ? JSON.parse(saved) : DEFAULT_INCLUDED_TERMS;
  });

  const [favorites, setFavorites] = useState<FavoriteVideo[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [newExcludedTerm, setNewExcludedTerm] = useState('');
  const [newIncludedTerm, setNewIncludedTerm] = useState('');

  useEffect(() => {
    localStorage.setItem('excludedTerms', JSON.stringify(excludedTerms));
  }, [excludedTerms]);

  useEffect(() => {
    localStorage.setItem('includedTerms', JSON.stringify(includedTerms));
  }, [includedTerms]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

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

  const toggleFavorite = (video: VideoItem) => {
    const existingIndex = favorites.findIndex(fav => fav.id.videoId === video.id.videoId);
    if (existingIndex >= 0) {
      setFavorites(favorites.filter((_, index) => index !== existingIndex));
    } else {
      const favoriteVideo: FavoriteVideo = {
        ...video,
        searchTerm: currentSearchTerm,
        filters: {
          includedTerms: [...includedTerms],
          excludedTerms: [...excludedTerms]
        }
      };
      setFavorites([...favorites, favoriteVideo]);
    }
  };

  const groupFavoritesBySearchTerm = () => {
    const grouped = favorites.reduce((acc, video) => {
      const key = video.searchTerm || 'Other';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(video);
      return acc;
    }, {} as Record<string, FavoriteVideo[]>);

    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => 
        new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime()
      );
    });

    return grouped;
  };

  const groupHistoryByDate = () => {
    return searchHistory.reduce((acc, item) => {
      const date = new Date(item.timestamp).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {} as Record<string, SearchHistory[]>);
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const addToSearchHistory = (term: string) => {
    const newHistory: SearchHistory = {
      term,
      timestamp: Date.now()
    };
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.term !== term);
      return [newHistory, ...filtered].slice(0, 10);
    });
  };

  const fetchVideos = async (searchTerm: string, pageToken?: string) => {
    try {
      let searchQuery = searchTerm;
      if (includedTerms.length > 0) {
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
    setShowFavorites(false);
    setShowHistory(false);
    addToSearchHistory(searchTerm);

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

  const clearHistory = () => {
    setSearchHistory([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      <header className="bg-white/95 backdrop-blur-sm shadow-lg py-4 mb-8 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Youtube className="w-8 h-8 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                YouTube Search
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowFilters(!showFilters);
                  setShowHistory(false);
                  setShowFavorites(false);
                }}
                className={`p-2 rounded-lg flex items-center gap-1 transition-colors ${
                  showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filters</span>
              </button>
              <button
                onClick={() => {
                  setShowHistory(!showHistory);
                  setShowFilters(false);
                  setShowFavorites(false);
                }}
                className={`p-2 rounded-lg flex items-center gap-1 transition-colors ${
                  showHistory ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'
                }`}
              >
                <History className="w-5 h-5" />
                <span className="hidden sm:inline">History</span>
              </button>
              <button
                onClick={() => {
                  setShowFavorites(!showFavorites);
                  setShowFilters(false);
                  setShowHistory(false);
                }}
                className={`p-2 rounded-lg flex items-center gap-1 transition-colors ${
                  showFavorites ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'
                }`}
              >
                <Heart className="w-5 h-5" />
                <span className="hidden sm:inline">Favorites</span>
              </button>
            </div>
          </div>

          <SearchBar onSearch={searchVideos} />

          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-xl shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Include Terms Section */}
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Include Terms</h2>
                  <form onSubmit={addIncludedTerm} className="flex gap-2">
                    <input
                      type="text"
                      value={newIncludedTerm}
                      onChange={(e) => setNewIncludedTerm(e.target.value)}
                      placeholder="Add term to include..."
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                  
                  {includedTerms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
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
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Exclude Terms</h2>
                  <form onSubmit={addExcludedTerm} className="flex gap-2">
                    <input
                      type="text"
                      value={newExcludedTerm}
                      onChange={(e) => setNewExcludedTerm(e.target.value)}
                      placeholder="Add term to exclude..."
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                  
                  {excludedTerms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
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
          )}

          {showHistory && (
            <div className="mt-4 p-4 bg-white rounded-xl shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Search History</h2>
                {searchHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear History
                  </button>
                )}
              </div>
              {Object.entries(groupHistoryByDate()).map(([date, items]) => (
                <div key={date} className="mb-4">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => toggleGroup(date)}
                  >
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-medium text-gray-700">{date}</h3>
                    {expandedGroups[date] ? (
                      <ChevronUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  {expandedGroups[date] && (
                    <div className="mt-2 ml-6 space-y-2">
                      {items.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => searchVideos(item.term)}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors w-full text-left"
                        >
                          <Search className="w-4 h-4 text-gray-600" />
                          <span className="text-sm">{item.term}</span>
                          <span className="text-xs text-gray-500 ml-auto">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {searchHistory.length === 0 && (
                <p className="text-gray-500 text-center">No search history</p>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 pb-8">
        {error && (
          <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showFavorites ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">Favorites</h2>
            {Object.entries(groupFavoritesBySearchTerm()).map(([searchTerm, videos]) => (
              <div key={searchTerm} className="mb-8">
                <div
                  className="flex items-center gap-2 cursor-pointer mb-4"
                  onClick={() => toggleGroup(searchTerm)}
                >
                  <Tag className="w-5 h-5 text-gray-600" />
                  <h3 className="text-xl font-semibold text-gray-800">
                    Search: {searchTerm}
                  </h3>
                  {expandedGroups[searchTerm] ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                {expandedGroups[searchTerm] && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {videos.map((video) => (
                      <VideoCard
                        key={video.id.videoId}
                        video={video}
                        isFavorite={true}
                        onToggleFavorite={() => toggleFavorite(video)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {favorites.length === 0 && (
              <p className="text-center text-gray-600">No favorite videos yet</p>
            )}
          </div>
        ) : (
          <>
            {!loading && !error && videos.length === 0 && !currentSearchTerm && (
              <div className="text-center text-gray-600">
                <p>Enter a search term to find videos</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={video.id.videoId}
                  video={video}
                  isFavorite={favorites.some(fav => fav.id.videoId === video.id.videoId)}
                  onToggleFavorite={() => toggleFavorite(video)}
                />
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;