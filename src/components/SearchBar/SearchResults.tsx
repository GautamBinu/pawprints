import { CircleX } from "lucide-react";
import React from "react";

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
  selectedFilter,
}) => {
  const hasActiveSearch = searchTerm.trim() !== "" || selectedFilter !== "All";

  if (isLoading) {
    return null;
  }

  if (!hasActiveSearch) {
    return null; // Don't show anything when no search is active
  }

  if (resultsCount === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <div className="mx-auto h-12 w-12 text-gray-300">
            <CircleX size={48} />
          </div>
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
        Found{" "}
        <span className="font-semibold text-gray-800">{resultsCount}</span>{" "}
        petition{resultsCount !== 1 ? "s" : ""}
        {searchTerm && (
          <span>
            {" "}
            matching "<span className="font-medium">{searchTerm}</span>"
          </span>
        )}
        {selectedFilter !== "All" && (
          <span>
            {" "}
            in <span className="font-medium">{selectedFilter}</span>
          </span>
        )}
      </p>
    </div>
  );
};

export default SearchResults;
