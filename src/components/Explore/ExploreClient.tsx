"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useAuth } from "@/app/auth/AuthContext";
import { SearchBar, PetitionGrid, SearchResults } from "@/components";
import { useDebounce } from "@/hooks/use-debounce";
import { Petition } from "@/types/petition";
import { useRouter } from "next/navigation";

interface ExploreClientProps {
  initialPetitions: Petition[];
}

export default function ExploreClient({
  initialPetitions,
}: ExploreClientProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [petitions, setPetitions] = useState<Petition[]>(initialPetitions);

  const router = useRouter();

  const handlePetitionClick = (petition: Petition) => {
    router.push(`/petitions/${petition.id}`);
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 1000);

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearchLoading(true);
    } else {
      setIsSearchLoading(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  const filteredPetitions = useMemo(() => {
    if (debouncedSearchTerm === "" && selectedFilter === "All") {
      return petitions;
    }

    return petitions.filter((petition) => {
      const matchesSearch =
        debouncedSearchTerm === "" ||
        petition.title
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());

      const matchesFilter =
        selectedFilter === "All" ||
        petition.tags.some((tag) => tag.name === selectedFilter);

      return matchesSearch && matchesFilter;
    });
  }, [petitions, debouncedSearchTerm, selectedFilter]);

  return (
    <div className="w-full flex flex-col px-4 sm:px-8 lg:px-20 py-10 bg-background text-foreground">
      <SearchBar
        onSearchChange={setSearchTerm}
        onFilterChange={setSelectedFilter}
        searchTerm={searchTerm}
        selectedFilter={selectedFilter}
      />
      <div className="flex flex-col mt-8 w-full">
        <SearchResults
          isLoading={isSearchLoading}
          resultsCount={filteredPetitions.length}
          searchTerm={debouncedSearchTerm}
          selectedFilter={selectedFilter}
        />
        <PetitionGrid
          petitions={filteredPetitions}
          isLoading={isSearchLoading}
          onPetitionClick={handlePetitionClick}
        />
      </div>
    </div>
  );
}
