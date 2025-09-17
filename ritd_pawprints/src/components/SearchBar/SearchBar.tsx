'use client';
import React, { useState } from 'react';

interface SearchBarProps {
  onSearchChange?: (searchTerm: string) => void;
  onFilterChange?: (filter: string) => void;
  searchTerm?: string;
  selectedFilter?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearchChange, 
  onFilterChange, 
  searchTerm = '', 
  selectedFilter = 'All' 
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [localSelectedFilter, setLocalSelectedFilter] = useState(selectedFilter);

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
    onSearchChange?.(value);
  };

  const handleFilterChange = (value: string) => {
    setLocalSelectedFilter(value);
    onFilterChange?.(value);
  };

  return (
    <div className="w-full flex items-center gap-4">
      {/* Search Input Container */}
      <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        {/* Search Icon */}
        <div className="flex items-center pointer-events-none mr-3">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search Petitions"
          value={localSearchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
        />
      </div>

      {/* Filter Dropdown as separate button */}
      <div className="relative">
        <div className="flex items-center bg-white border border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
          <select
            value={localSelectedFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="appearance-none bg-transparent border-none outline-none text-gray-700 cursor-pointer pr-2"
          >
            <option value="All">All</option>
            <option value="Technology">Technology</option>
            <option value="Academics">Academics</option>
            <option value="Parking & Transportation">Parking & Transportation</option>
            <option value="Other">Other</option>
            <option value="Dining">Dining</option>
            <option value="Sustainability">Sustainability</option>
            <option value="Facilities">Facilities</option>
            <option value="Housing">Housing</option>
            <option value="Public Safety">Public Safety</option>
            <option value="Campus Life">Campus Life</option>
            <option value="Governance">Governance</option>
            <option value="Clubs & Organizations">Clubs & Organizations</option>
            <option value="Deaf Advocacy">Deaf Advocacy</option>
          </select>
          <svg 
            className="w-4 h-4 text-gray-400 ml-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 9l-7 7-7-7" 
            />
          </svg>
        </div>
      </div>

      {/* Filter/Sort Icons */}
      <div className="flex items-center gap-2 ml-4">
        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </button>
        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
