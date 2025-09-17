import React from 'react';

interface SearchResultsProps {
  isLoading: boolean;
  resultsCount: number;
  searchTerm: string;
  selectedFilter: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  isLoading, 
  resultsCount, 
  searchTerm, 
  selectedFilter 
}) => {
  const hasActiveSearch = searchTerm.trim() !== '' || selectedFilter !== 'All';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
          <span>Searching petitions...</span>
        </div>
      </div>
    );
  }

  if (!hasActiveSearch) {
    return null; // Don't show anything when no search is active
  }

  if (resultsCount === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg font-medium">No petitions found</p>
        <p className="text-gray-400 text-sm mt-2">
          Try adjusting your search term or selecting a different category
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <p className="text-gray-600 text-sm">
        Found <span className="font-semibold text-gray-800">{resultsCount}</span> petition{resultsCount !== 1 ? 's' : ''}
        {searchTerm && (
          <span> matching "<span className="font-medium">{searchTerm}</span>"</span>
        )}
        {selectedFilter !== 'All' && (
          <span> in <span className="font-medium">{selectedFilter}</span></span>
        )}
      </p>
    </div>
  );
};

export default SearchResults;
