
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  RefreshCcw, 
  Twitter, 
  Youtube, 
  Globe, 
  LayoutDashboard, 
  Sparkles, 
  TrendingUp, 
  History, 
  Info,
  Plus,
  Trash2,
  BookmarkCheck,
  ExternalLink,
  ChevronRight,
  Languages,
  Loader2,
  Share2,
  Check,
  Layers
} from 'lucide-react';
import { fetchNewsForTopic, translateNewsItem, translateLargeText } from './services/gemini';
import { SourceType, NewsState, NewsItem } from './types';

// Refined Skeleton Components
const CardSkeleton = () => (
  <div className="bg-zinc-900/20 border border-zinc-800/30 p-6 rounded-[2rem] flex flex-col md:row gap-6 animate-pulse">
    <div className="flex-shrink-0 w-12 h-12 bg-zinc-800 rounded-2xl"></div>
    <div className="flex-1 space-y-4">
      <div className="flex justify-between items-start gap-4">
        <div className="h-6 bg-zinc-800 rounded-lg w-3/4"></div>
        <div className="h-8 w-8 bg-zinc-800 rounded-lg"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-zinc-800/60 rounded-md w-full"></div>
        <div className="h-4 bg-zinc-800/60 rounded-md w-5/6"></div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <div className="h-5 bg-zinc-800/40 rounded-full w-20"></div>
        <div className="h-1 w-1 bg-zinc-800 rounded-full"></div>
        <div className="h-3 bg-zinc-800/30 rounded-full w-24"></div>
      </div>
    </div>
  </div>
);

const SynthesisSkeleton = () => (
  <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-zinc-800 rounded-2xl"></div>
      <div className="h-6 bg-zinc-800 rounded-lg w-40"></div>
    </div>
    <div className="space-y-3">
      <div className="h-5 bg-zinc-800/70 rounded-md w-full"></div>
      <div className="h-5 bg-zinc-800/70 rounded-md w-full"></div>
      <div className="h-5 bg-zinc-800/70 rounded-md w-11/12"></div>
      <div className="h-5 bg-zinc-800/70 rounded-md w-full"></div>
      <div className="h-5 bg-zinc-800/70 rounded-md w-4/5"></div>
    </div>
  </div>
);

const FullSkeleton = () => (
  <div className="space-y-10">
    <div className="space-y-3">
      <div className="h-4 bg-zinc-800/50 rounded-md w-24"></div>
      <div className="h-10 bg-zinc-800 rounded-xl w-64"></div>
    </div>
    
    <SynthesisSkeleton />
    
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 border-b border-zinc-800 pb-4">
        <div className="h-8 bg-zinc-800 rounded-lg w-48"></div>
        <div className="h-10 bg-zinc-900 rounded-xl w-64"></div>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

interface TranslationData {
  title: string;
  summary: string;
  loading: boolean;
  translated: boolean;
}

const App: React.FC = () => {
  const [state, setState] = useState<NewsState>({
    topic: 'Artificial Intelligence',
    items: [],
    brief: '',
    groundingSources: [],
    loading: false,
    error: null,
  });

  const [inputTopic, setInputTopic] = useState('Artificial Intelligence');
  const [activeTab, setActiveTab] = useState<SourceType>(SourceType.ALL);
  const [translations, setTranslations] = useState<Record<string, TranslationData>>({});
  const [synthesisTranslation, setSynthesisTranslation] = useState<{
    text: string;
    loading: boolean;
    translated: boolean;
  }>({ text: '', loading: false, translated: false });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [savedTopics, setSavedTopics] = useState<string[]>(() => {
    const saved = localStorage.getItem('trendpulse_topics');
    return saved ? JSON.parse(saved) : ['AI', 'SpaceX', 'Web3', 'Nvidia', 'HealthTech'];
  });

  useEffect(() => {
    localStorage.setItem('trendpulse_topics', JSON.stringify(savedTopics));
  }, [savedTopics]);

  const handleRefresh = useCallback(async (searchTopic?: string) => {
    const topicToSearch = searchTopic || state.topic;
    setState(prev => ({ ...prev, loading: true, error: null }));
    setTranslations({}); 
    setSynthesisTranslation({ text: '', loading: false, translated: false });
    try {
      const result = await fetchNewsForTopic(topicToSearch);
      setState(prev => ({
        ...prev,
        topic: topicToSearch,
        brief: result.brief,
        items: result.newsItems,
        groundingSources: result.groundingSources,
        loading: false
      }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: "Failed to fetch latest news. Please check your connection and try again." 
      }));
    }
  }, [state.topic]);

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputTopic.trim()) {
      handleRefresh(inputTopic);
    }
  };

  const handleShare = async (item: NewsItem) => {
    const shareData = {
      title: item.title,
      text: `Check out this news about ${state.topic}: ${item.title}`,
      url: item.url
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User might have cancelled or browser blocked it, fallback to copy
        copyToClipboard(item.url, item.id);
      }
    } else {
      copyToClipboard(item.url, item.id);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleTranslateSynthesis = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Ensure no parent event interference
    
    if (synthesisTranslation.translated) {
      setSynthesisTranslation(prev => ({ ...prev, translated: false }));
      return;
    }

    if (synthesisTranslation.text) {
      setSynthesisTranslation(prev => ({ ...prev, translated: true }));
      return;
    }

    setSynthesisTranslation(prev => ({ ...prev, loading: true }));
    try {
      const translatedText = await translateLargeText(state.brief);
      setSynthesisTranslation({ 
        text: translatedText, 
        loading: false, 
        translated: true 
      });
    } catch (err) {
      console.error("Synthesis translation failed:", err);
      setSynthesisTranslation(prev => ({ ...prev, loading: false }));
    }
  };

  const handleTranslate = async (item: NewsItem) => {
    if (translations[item.id]?.translated) {
      setTranslations(prev => ({
        ...prev,
        [item.id]: { ...prev[item.id], translated: false }
      }));
      return;
    }

    if (translations[item.id]?.title) {
      setTranslations(prev => ({
        ...prev,
        [item.id]: { ...prev[item.id], translated: true }
      }));
      return;
    }

    setTranslations(prev => ({
      ...prev,
      [item.id]: { title: '', summary: '', loading: true, translated: false }
    }));

    try {
      const result = await translateNewsItem(item.title, item.summary);
      setTranslations(prev => ({
        ...prev,
        [item.id]: { 
          title: result.title, 
          summary: result.summary, 
          loading: false, 
          translated: true 
        }
      }));
    } catch (err) {
      setTranslations(prev => ({
        ...prev,
        [item.id]: { ...prev[item.id], loading: false }
      }));
    }
  };

  const handleSimilarSearch = (item: NewsItem) => {
    // Extract key context from the title by taking first 4-5 words or specific nouns
    const context = item.title.split(' ').slice(0, 5).join(' ');
    const newQuery = `${state.topic} focus on ${context}`;
    setInputTopic(newQuery);
    handleRefresh(newQuery);
  };

  const saveCurrentTopic = () => {
    const current = state.topic.trim();
    if (current && !savedTopics.some(t => t.toLowerCase() === current.toLowerCase())) {
      setSavedTopics(prev => [current, ...prev]);
    }
  };

  const removeTopic = (topicToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedTopics(prev => prev.filter(t => t !== topicToRemove));
  };

  const filteredItems = state.items.filter(item => {
    if (activeTab === SourceType.ALL) return true;
    return item.type === activeTab;
  });

  const isCurrentTopicSaved = savedTopics.some(t => t.toLowerCase() === state.topic.toLowerCase());

  const getSourceIcon = (type: SourceType) => {
    switch(type) {
      case SourceType.X: return <Twitter size={18} />;
      case SourceType.YOUTUBE: return <Youtube size={18} />;
      default: return <Globe size={18} />;
    }
  };

  const getSourceColor = (type: SourceType) => {
    switch(type) {
      case SourceType.X: return 'text-sky-400 bg-sky-400/10';
      case SourceType.YOUTUBE: return 'text-red-500 bg-red-500/10';
      default: return 'text-emerald-400 bg-emerald-400/10';
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar - Navigation */}
      <aside className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col sticky top-0 md:h-screen z-40">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-600/20">
            <TrendingUp size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">TrendPulse</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">My Topics</p>
          {savedTopics.map(topic => (
            <button 
              key={topic}
              onClick={() => {
                setInputTopic(topic);
                handleRefresh(topic);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between group transition-all ${
                state.topic.toLowerCase() === topic.toLowerCase()
                  ? 'bg-zinc-800 text-white shadow-lg' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <History size={16} className={state.topic.toLowerCase() === topic.toLowerCase() ? 'text-indigo-400' : 'text-zinc-600'} />
                <span className="text-sm font-medium truncate max-w-[120px]">{topic}</span>
              </div>
              <Trash2 
                size={14} 
                className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-opacity" 
                onClick={(e) => removeTopic(topic, e)}
              />
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2 mb-2 text-zinc-300">
              <Sparkles size={16} className="text-amber-400" />
              <span className="text-xs font-semibold">Gemini Grounded</span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Powered by real-time web search and automated verification for peak relevance.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 p-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSubmit} className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="text" 
                value={inputTopic}
                onChange={(e) => setInputTopic(e.target.value)}
                placeholder="Explore any topic..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
              />
            </form>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!isCurrentTopicSaved ? (
                <button
                  onClick={saveCurrentTopic}
                  disabled={state.loading}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  <Plus size={16} />
                  <span>Save</span>
                </button>
              ) : (
                <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-zinc-800/80 border border-zinc-700 text-indigo-400 text-sm font-semibold rounded-full">
                  <BookmarkCheck size={16} />
                  <span>Saved</span>
                </div>
              )}
              
              <button 
                onClick={() => handleRefresh()}
                disabled={state.loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-medium rounded-full transition-all border border-zinc-700 active:scale-95"
              >
                <RefreshCcw size={16} className={state.loading ? 'animate-spin' : ''} />
                <span>Sync</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-10">
            {state.loading ? (
              <FullSkeleton />
            ) : state.error ? (
              <div className="space-y-10">
                 <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded tracking-widest border border-red-500/30">
                        Error Occurred
                      </span>
                    </div>
                    <h2 className="text-4xl font-extrabold text-white mb-0 tracking-tight leading-tight">
                      Could not load: <span className="text-red-400">{state.topic}</span>
                    </h2>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/20 p-10 rounded-3xl text-red-400 flex flex-col items-center gap-4 text-center">
                    <Info size={48} className="text-red-500/50" />
                    <p className="text-lg font-medium">{state.error}</p>
                    <button onClick={() => handleRefresh()} className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all font-bold">Try Refreshing</button>
                  </div>
              </div>
            ) : (
              <>
                {/* Title Section */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase rounded tracking-widest border border-indigo-500/30">
                      Daily Brief
                    </span>
                    <span className="text-zinc-500 text-xs font-medium uppercase tracking-tight">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <h2 className="text-4xl font-extrabold text-white mb-0 tracking-tight leading-tight">
                    Latest on: <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">{state.topic}</span>
                  </h2>
                </div>

                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* Daily Synthesis */}
                  <section className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                      <Sparkles size={160} className="text-indigo-400" />
                    </div>
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                          <LayoutDashboard size={20} className="text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Daily Synthesis</h3>
                      </div>
                      
                      <button
                        onClick={handleTranslateSynthesis}
                        disabled={synthesisTranslation.loading}
                        className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold cursor-pointer relative z-20 ${
                          synthesisTranslation.translated 
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                            : 'bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                        }`}
                      >
                        {synthesisTranslation.loading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Languages size={16} />
                        )}
                        <span>
                          {synthesisTranslation.translated ? 'Show Original' : 'Translate to Thai'}
                        </span>
                      </button>
                    </div>
                    
                    <div className={`prose prose-invert max-w-none text-zinc-300 leading-relaxed text-lg font-normal whitespace-pre-wrap transition-all duration-300 relative z-10 ${synthesisTranslation.translated ? 'font-thai' : ''}`}>
                      {synthesisTranslation.translated ? synthesisTranslation.text : (state.brief || "Searching for the latest updates...")}
                    </div>
                  </section>

                  {/* News Feed */}
                  <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                      <h3 className="text-2xl font-bold text-white tracking-tight">Individual Updates</h3>
                      
                      <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 overflow-x-auto no-scrollbar">
                        {[
                          { id: SourceType.ALL, label: 'All' },
                          { id: SourceType.X, label: 'X (Twitter)' },
                          { id: SourceType.YOUTUBE, label: 'YouTube' },
                          { id: SourceType.NEWS, label: 'News' }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as SourceType)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                              activeTab === tab.id 
                                ? 'bg-zinc-800 text-white shadow-lg' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item) => {
                          const translation = translations[item.id];
                          const showThai = translation?.translated;
                          const isCopied = copiedId === item.id;

                          return (
                            <div 
                              key={item.id}
                              className="group bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-[2rem] hover:bg-zinc-900/60 hover:border-indigo-500/30 transition-all flex flex-col md:flex-row gap-6 relative"
                            >
                              <div className={`flex-shrink-0 p-4 rounded-2xl h-fit self-start ${getSourceColor(item.type)}`}>
                                {getSourceIcon(item.type)}
                              </div>
                              
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <h4 className={`text-xl font-bold text-zinc-100 group-hover:text-indigo-400 transition-all leading-tight ${showThai ? 'font-thai' : ''}`}>
                                    {showThai ? translation.title : item.title}
                                  </h4>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={() => handleTranslate(item)}
                                      disabled={translation?.loading}
                                      className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-xs font-bold cursor-pointer ${
                                        showThai 
                                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                                          : 'bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                                      }`}
                                    >
                                      {translation?.loading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                      ) : (
                                        <Languages size={16} />
                                      )}
                                      <span className="hidden sm:inline">
                                        {showThai ? 'Show Original' : 'Translate to Thai'}
                                      </span>
                                    </button>

                                    <button
                                      onClick={() => handleShare(item)}
                                      className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-xs font-bold cursor-pointer ${
                                        isCopied
                                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                          : 'bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                                      }`}
                                    >
                                      {isCopied ? <Check size={16} /> : <Share2 size={16} />}
                                      <span className="hidden sm:inline">
                                        {isCopied ? 'Copied!' : 'Share'}
                                      </span>
                                    </button>

                                    <a 
                                      href={item.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="p-2 bg-zinc-800/50 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                      <ExternalLink size={18} />
                                    </a>
                                  </div>
                                </div>
                                
                                <p className={`text-zinc-400 text-sm leading-relaxed font-medium transition-all ${showThai ? 'font-thai' : ''}`}>
                                  {showThai ? translation.summary : item.summary}
                                </p>
                                
                                <div className="flex items-center gap-5 pt-2 flex-wrap">
                                  <span className="text-[10px] font-bold text-zinc-500 bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800 uppercase tracking-widest">
                                    {item.source}
                                  </span>
                                  <div className="h-1 w-1 bg-zinc-700 rounded-full" />
                                  <button 
                                    onClick={() => window.open(item.url, '_blank')}
                                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1 group/btn"
                                  >
                                    View Full Post <ChevronRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                  </button>
                                  <div className="h-1 w-1 bg-zinc-700 rounded-full" />
                                  <button 
                                    onClick={() => handleSimilarSearch(item)}
                                    className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-widest flex items-center gap-1 group/btn"
                                  >
                                    View Similar <Layers size={12} className="group-hover/btn:scale-110 transition-transform" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-24 text-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
                          <div className="bg-zinc-900/50 p-4 rounded-full w-fit mx-auto mb-4 border border-zinc-800">
                            <Search size={32} className="text-zinc-700" />
                          </div>
                          <p className="text-zinc-500 font-medium">No results found for {activeTab === SourceType.ALL ? 'this topic' : activeTab}.</p>
                          <p className="text-zinc-600 text-sm mt-1">Try switching tabs or searching for a broader term.</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </>
            )}
            
            <div className="h-24" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
