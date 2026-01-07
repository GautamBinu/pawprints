"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useAuth } from "@/app/auth/AuthContext";
import {
  SearchBar,
  PetitionGrid,
  SearchResults,
  PetitionModal,
} from "@/components";
import { useDebounce } from "@/hooks/use-debounce";
import { Petition } from "@/types/petition";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

interface HomeClientProps {
  initialPetitions: Petition[];
}

export default function HomeClient({ initialPetitions }: HomeClientProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [petitions, setPetitions] = useState<Petition[]>(initialPetitions);

  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Sync URL to State
  useEffect(() => {
    const petitionId = searchParams.get("petitionId") || searchParams.get("p");
    if (petitionId && petitions.length > 0) {
      const petition = petitions.find((p) => p.id === parseInt(petitionId));
      if (petition) {
        setSelectedPetition(petition);
        setIsModalOpen(true);
      } else {
        // Petition not found (invalid ID or not published)
        setIsModalOpen(false);
        setSelectedPetition(null);
        toast.error("Petition not found");

        const params = new URLSearchParams(searchParams.toString());
        params.delete("petitionId");
        params.delete("p");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    } else if (!petitionId) {
      setIsModalOpen(false);
      setSelectedPetition(null);
    }
  }, [searchParams, petitions, router, pathname]);

  const handlePetitionClick = (petition: Petition) => {
    setSelectedPetition(petition);
    setIsModalOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("p", petition.id.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("p");
    params.delete("petitionId");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    // Delay clearing the selected petition to allow exit animation
    setTimeout(() => setSelectedPetition(null), 300);
  };

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);

  // Show loading state when search term changes
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearchLoading(true);
    } else {
      setIsSearchLoading(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  // Filter petitions based on debounced search term and selected filter
  const filteredPetitions = useMemo(() => {
    // Show all petitions by default when no search is active
    if (debouncedSearchTerm === "" && selectedFilter === "All") {
      return petitions;
    }

    return petitions.filter((petition) => {
      // Filter by search term (title search)
      const matchesSearch =
        debouncedSearchTerm === "" ||
        petition.title
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());

      // Filter by category
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
      <PetitionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        petition={selectedPetition}
      />
    </div>
  );
}
