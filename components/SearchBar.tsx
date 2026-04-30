import { useState } from 'react';
import type { ProjectStatus } from '@/lib/confluence';

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  availableTags: string[];
}

export interface SearchFilters {
  query: string;
  tags: string[];
  status: StatusFilter;
}

type StatusFilter = 'all' | ProjectStatus;

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
  { value: 'coming-soon', label: 'Coming soon' },
  { value: 'all', label: 'All' },
];

export default function SearchBar({
  onSearch,
  availableTags,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  const handleSearch = (
    newQuery?: string,
    newTags?: string[],
    newStatus?: StatusFilter
  ) => {
    const q = newQuery !== undefined ? newQuery : query;
    const tags = newTags !== undefined ? newTags : selectedTags;
    const status = newStatus !== undefined ? newStatus : statusFilter;

    onSearch(q, { query: q, tags, status });
  };

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    handleSearch(query, newTags, statusFilter);
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedTags([]);
    setStatusFilter('active');
    onSearch('', { query: '', tags: [], status: 'active' });
  };

  return (
    <div className="mb-8">
      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search projects by name or description..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value, selectedTags, statusFilter);
          }}
          className="w-full px-4 py-3 text-lg border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Status
        </label>
        <div className="flex flex-wrap gap-3">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                setStatusFilter(value);
                handleSearch(query, selectedTags, value);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === value
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tag Filters */}
      {availableTags.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear Button */}
      {(query || selectedTags.length > 0 || statusFilter !== 'active') && (
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
