import { Search, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  id: string;
  title: string;
  type: "page" | "project" | "render" | "action";
  icon?: string;
}

interface SearchBarProps {
  placeholder?: string;
  results?: SearchResult[];
  onSearch?: (query: string) => void;
}

const MOCK_RESULTS: SearchResult[] = [
  { id: "1", title: "Dashboard", type: "page" },
  { id: "2", title: "Rendus", type: "page" },
  { id: "3", title: "Agent IA", type: "page" },
  { id: "4", title: "Mini Archi", type: "page" },
  { id: "5", title: "Nouveau projet", type: "action" },
  { id: "6", title: "Nouveau rendu", type: "action" },
];

export function SearchBar({
  placeholder = "Rechercher...",
  results = MOCK_RESULTS
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (searchQuery.length > 0) {
        const filtered = results.filter(r =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredResults(filtered);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 300);
  }, [results]);

  useEffect(() => {
    handleSearch(query);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, handleSearch]);

  const handleSelect = (result: SearchResult) => {
    setQuery("");
    setIsOpen(false);

    switch (result.type) {
      case "page":
        if (result.title === "Dashboard") navigate("/dashboard");
        else if (result.title === "Rendus") navigate("/dashboard/render");
        else if (result.title === "Mini Archi") navigate("/archi");
        break;
      case "action":
        // Handle actions
        break;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0EAE0]/50" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-[#1a1a1a] border border-[#C4A264]/20 rounded-lg text-[#F0EAE0] placeholder:text-[#F0EAE0]/50 focus:outline-none focus:border-[#C4A264]/50"
          onFocus={() => query.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F0EAE0]/50 hover:text-[#F0EAE0]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && filteredResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#C4A264]/20 rounded-lg shadow-xl z-50 max-h-64 overflow-auto">
          {filteredResults.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-2 text-left hover:bg-[#C4A264]/10 flex items-center gap-3 text-[#F0EAE0]"
            >
              <span className="text-xs uppercase text-[#C4A264]/50">{result.type}</span>
              <span>{result.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}