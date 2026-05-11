import { Search, X, Clock, FileText, Image, FolderOpen, Layers, Trash2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  fuzzySearch,
  loadSearchHistory,
  saveSearchToHistory,
  clearSearchHistory,
  removeFromHistory,
  groupResultsByType,
  SearchableType,
  SearchResult,
  SEARCH_CONFIG,
} from "../lib/search";

interface SearchableItem {
  id: string;
  type: SearchableType;
  title: string;
  content?: string;
  tags?: string[];
}

interface SearchBarProps {
  placeholder?: string;
  items?: SearchableItem[];
  onSearch?: (query: string, results: SearchResult[]) => void;
}

/** Labels affichés par type */
const TYPE_LABELS: Record<SearchableType, { label: string; icon: React.ReactNode }> = {
  project: { label: "Projets", icon: <FolderOpen className="w-4 h-4" /> },
  render: { label: "Rendus", icon: <Image className="w-4 h-4" /> },
  file: { label: "Fichiers", icon: <FileText className="w-4 h-4" /> },
  page: { label: "Pages", icon: <Layers className="w-4 h-4" /> },
  action: { label: "Actions", icon: <Search className="w-4 h-4" /> },
};

/** Navigation par défaut selon le type */
const DEFAULT_NAVIGATIONS: Record<string, string> = {
  Dashboard: "/dashboard",
  Rendus: "/dashboard/render",
  "Agent IA": "/dashboard/agent",
  "Mini Archi": "/archi",
  "Nouveau projet": "/dashboard/projects/new",
  "Nouveau rendu": "/dashboard/render/new",
};

const DEFAULT_ITEMS: SearchableItem[] = [
  { id: "p1", type: "page", title: "Dashboard", tags: ["navigation"] },
  { id: "p2", type: "page", title: "Rendus", tags: ["navigation"] },
  { id: "p3", type: "page", title: "Agent IA", tags: ["navigation"] },
  { id: "p4", type: "page", title: "Mini Archi", tags: ["navigation"] },
  { id: "a1", type: "action", title: "Nouveau projet", tags: ["action", "create"] },
  { id: "a2", type: "action", title: "Nouveau rendu", tags: ["action", "create"] },
  { id: "a3", type: "action", title: "Exporter", tags: ["action", "export"] },
];

export function SearchBar({
  placeholder = "Rechercher...",
  items = DEFAULT_ITEMS,
  onSearch,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<SearchableType | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Charger l'historique au montage
  useEffect(() => {
    setHistory(loadSearchHistory());
  }, []);

  // Recherche avec debounce
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        if (searchQuery.trim().length > 0) {
          const searchResults = fuzzySearch(searchQuery, items, SEARCH_CONFIG.fuzzyThreshold);
          setResults(searchResults);

          if (onSearch) {
            onSearch(searchQuery, searchResults);
          }

          // Sauvegarder dans l'historique si résultat pertinent
          if (searchResults.length > 0) {
            saveSearchToHistory(searchQuery);
            setHistory(loadSearchHistory());
          }
        } else {
          setResults([]);
        }
      }, 300);
    },
    [items, onSearch]
  );

  useEffect(() => {
    performSearch(query);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // Grouper les résultats par type
  const groupedResults = useMemo(() => {
    return groupResultsByType(results);
  }, [results]);

  // Types disponibles dans les résultats
  const availableTypes = useMemo(() => {
    return Array.from(groupedResults.keys());
  }, [groupedResults]);

  const handleSelect = (result: SearchResult) => {
    const { item } = result;
    setQuery("");
    setIsOpen(false);
    setShowHistory(false);

    // Navigation selon le type
    if (item.type === "page" && DEFAULT_NAVIGATIONS[item.title]) {
      navigate(DEFAULT_NAVIGATIONS[item.title]);
    } else if (item.type === "project") {
      navigate(`/dashboard/projects/${item.id}`);
    } else if (item.type === "render") {
      navigate(`/dashboard/render/${item.id}`);
    } else if (item.type === "action") {
      // Gérer les actions
      if (item.title === "Nouveau projet") {
        navigate("/dashboard/projects/new");
      } else if (item.title === "Nouveau rendu") {
        navigate("/dashboard/render/new");
      }
    }
  };

  const handleHistorySelect = (historyQuery: string) => {
    setQuery(historyQuery);
    setShowHistory(false);
    setIsOpen(true);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
  };

  const handleRemoveHistoryItem = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    removeFromHistory(query);
    setHistory(loadSearchHistory());
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0EAE0]/50" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setShowHistory(e.target.value.length === 0 && history.length > 0);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-[#1a1a1a] border border-[#C4A264]/20 rounded-lg text-[#F0EAE0] placeholder:text-[#F0EAE0]/50 focus:outline-none focus:border-[#C4A264]/50"
          onFocus={() => {
            if (query.length === 0 && history.length > 0) {
              setShowHistory(true);
              setIsOpen(true);
            } else if (query.length > 0) {
              setIsOpen(true);
            }
          }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F0EAE0]/50 hover:text-[#F0EAE0]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#C4A264]/20 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Filtres de type */}
          {results.length > 0 && (
            <div className="flex gap-2 p-3 border-b border-[#C4A264]/10 overflow-x-auto">
              <button
                onClick={() => setSelectedTypeFilter(null)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  selectedTypeFilter === null
                    ? "bg-[#C4A264] text-[#1a1a1a]"
                    : "bg-[#C4A264]/10 text-[#F0EAE0]/70 hover:bg-[#C4A264]/20"
                }`}
              >
                Tous ({results.length})
              </button>
              {availableTypes.map((type) => {
                const typeResults = groupedResults.get(type) || [];
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedTypeFilter(type)}
                    className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
                      selectedTypeFilter === type
                        ? "bg-[#C4A264] text-[#1a1a1a]"
                        : "bg-[#C4A264]/10 text-[#F0EAE0]/70 hover:bg-[#C4A264]/20"
                    }`}
                  >
                    {TYPE_LABELS[type]?.icon}
                    {TYPE_LABELS[type]?.label} ({typeResults.length})
                  </button>
                );
              })}
            </div>
          )}

          {/* Contenu */}
          <div className="overflow-auto flex-1">
            {/* Historique */}
            {showHistory && history.length > 0 && (
              <div className="p-2">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-[#F0EAE0]/50 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Recherches récentes
                  </span>
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-[#F0EAE0]/50 hover:text-[#F0EAE0] flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Effacer
                  </button>
                </div>
                {history.map((historyQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistorySelect(historyQuery)}
                    className="w-full px-3 py-2 text-left hover:bg-[#C4A264]/10 flex items-center justify-between text-[#F0EAE0]"
                  >
                    <span>{historyQuery}</span>
                    <button
                      onClick={(e) => handleRemoveHistoryItem(e, historyQuery)}
                      className="text-[#F0EAE0]/30 hover:text-[#F0EAE0]/60"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </button>
                ))}
              </div>
            )}

            {/* Résultats groupés par type */}
            {!showHistory && results.length > 0 && (
              <div className="p-2">
                {Array.from(groupedResults.entries())
                  .filter(([type]) => !selectedTypeFilter || selectedTypeFilter === type)
                  .map(([type, typeResults]) => {
                    const { label, icon } = TYPE_LABELS[type] || { label: type, icon: null };
                    return (
                      <div key={type} className="mb-3">
                        <div className="flex items-center gap-2 px-3 py-1 text-xs text-[#C4A264]/70 uppercase">
                          {icon}
                          {label}
                        </div>
                        {typeResults.map((result) => (
                          <button
                            key={result.item.id}
                            onClick={() => handleSelect(result)}
                            className="w-full px-3 py-2 text-left hover:bg-[#C4A264]/10 flex items-center justify-between text-[#F0EAE0]"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium">{result.item.title}</span>
                              {result.item.tags && result.item.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {result.item.tags.slice(0, 2).map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs px-1.5 py-0.5 rounded bg-[#C4A264]/10 text-[#C4A264]/70"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {result.score > 0 && (
                              <span className="text-xs text-[#F0EAE0]/30">
                                {Math.round(result.score * 100)}%
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Pas de résultats */}
            {!showHistory && query.trim().length > 0 && results.length === 0 && (
              <div className="p-4 text-center text-[#F0EAE0]/50 text-sm">
                Aucun résultat pour "{query}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}