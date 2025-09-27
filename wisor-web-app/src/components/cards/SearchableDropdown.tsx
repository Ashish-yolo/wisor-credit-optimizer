'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Option {
  id: string;
  name: string;
  value: string;
  [key: string]: any;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  searchPlaceholder?: string;
  renderOption?: (option: Option) => React.ReactNode;
  error?: string;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
  label,
  searchPlaceholder = "Search...",
  renderOption,
  error
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected option
  const selectedOption = options.find(option => option.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setSearchTerm('');
  };

  const handleSelect = (option: Option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter' && filteredOptions.length > 0) {
      e.preventDefault();
      handleSelect(filteredOptions[0]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      
      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "relative w-full bg-white border rounded-xl shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            error ? "border-red-300" : "border-slate-300",
            "hover:border-slate-400 transition-colors"
          )}
        >
          <span className={cn(
            "block truncate",
            selectedOption ? "text-slate-900" : "text-slate-400"
          )}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className={cn(
              "h-5 w-5 text-slate-400 transition-transform",
              isOpen && "rotate-180"
            )} />
          </span>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-xl border border-slate-200 rounded-xl max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "relative w-full text-left px-4 py-3 hover:bg-slate-50 focus:outline-none focus:bg-slate-50 transition-colors",
                      value === option.value && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      {renderOption ? renderOption(option) : (
                        <span className="block truncate">{option.name}</span>
                      )}
                      {value === option.value && (
                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  No results found for "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}