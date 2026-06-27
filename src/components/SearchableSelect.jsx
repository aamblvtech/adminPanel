import { useState, useEffect, useRef } from "react";

export default function SearchableSelect({
  options = [],
  value = "",
  onChange = () => {},
  placeholder = "-- Select --",
  searchPlaceholder = "Search...",
  disabled = false,
  hasClearButton = false,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Find the currently selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search terms
  const filteredOptions = options.filter((opt) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().trim();
    if (opt.searchTerms) {
      return opt.searchTerms.includes(query);
    }
    return (
      opt.label.toLowerCase().includes(query) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(query))
    );
  });


  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle keyboard scrolling of highlighted item
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const list = listRef.current;
      const items = list.children;
      const highlightedItem = items[highlightedIndex];
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          filteredOptions.length > 0 ? (prev + 1) % filteredOptions.length : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          filteredOptions.length > 0
            ? (prev - 1 + filteredOptions.length) % filteredOptions.length
            : 0
        );
        break;
      case "Enter":
        e.preventDefault();
        if (
          filteredOptions.length > 0 &&
          highlightedIndex >= 0 &&
          highlightedIndex < filteredOptions.length
        ) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
      case "Tab":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Helper to highlight matching text in options
  const highlightText = (text, query) => {
    if (!query) return text;
    const cleanQuery = query.trim();
    if (!cleanQuery) return text;

    // Escape regex special chars
    const escapedQuery = cleanQuery
      .replace(/[\\^$*+?.()|[\]{}]/g, "\\$&")
      .replace(/\//g, "\\/");
    const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));

    return parts.map((part, index) =>
      part.toLowerCase() === cleanQuery.toLowerCase() ? (
        <mark
          key={index}
          className="bg-amber-100 text-amber-900 rounded-sm px-0.5 font-semibold"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-left text-sm text-slate-900 outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 transition-all flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <div className="truncate flex-1">
          {selectedOption ? (
            <div className="flex flex-col text-left">
              <span className="font-semibold text-slate-900 leading-tight">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-xs text-slate-400 mt-0.5 truncate">
                  {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasClearButton && selectedOption && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </span>
          )}
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl overflow-hidden flex flex-col max-h-80">
          {/* Sticky Search Input */}
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <svg
              className="w-4 h-4 text-slate-400 ml-2 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent py-1.5 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            className="overflow-y-auto py-1 max-h-56 divide-y divide-slate-50 scroll-smooth"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-6 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                <svg
                  className="w-8 h-8 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>No results found for "{searchQuery}"</span>
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={option.value}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-4 py-2 text-sm transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      isHighlighted
                        ? "bg-slate-100 text-slate-950 font-medium"
                        : "text-slate-800 hover:bg-slate-50"
                    } ${
                      isSelected ? "bg-slate-50/80 text-slate-950 font-semibold" : ""
                    }`}
                  >
                    <div className="flex flex-col truncate">
                      <span className="truncate">
                        {highlightText(option.label, searchQuery)}
                      </span>
                      {option.sublabel && (
                        <span
                          className={`text-xs mt-0.5 truncate ${
                            isHighlighted ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {highlightText(option.sublabel, searchQuery)}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-slate-900 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
