"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/app/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Petition } from "@/types/petition";
import { useRouter } from "next/navigation";
import { PlusCircle, Search, ClipboardCheck } from "lucide-react";
import { checkAdminAccess } from "@/app/actions";
import { SearchBar, PetitionGrid, SearchResults } from "@/components";
import { useDebounce } from "@/hooks/use-debounce";

interface LoggedInHomeProps {
  trendingPetitions: Petition[];
}

export default function LoggedInHome({ trendingPetitions }: LoggedInHomeProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 1000);

  const handlePetitionClick = (petition: Petition) => {
    router.push(`/petitions/${petition.id}`);
  };

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearchLoading(true);
    } else {
      setIsSearchLoading(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    checkAdminAccess().then(setIsAdmin).catch(console.error);
  }, []);

  const filteredPetitions = useMemo(() => {
    const sortedPetitions = [...trendingPetitions].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    if (debouncedSearchTerm === "" && selectedFilter === "All") {
      return sortedPetitions;
    }

    return sortedPetitions.filter((petition) => {
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
  }, [trendingPetitions, debouncedSearchTerm, selectedFilter]);

  return (
    <div className="container mx-auto px-6 py-24">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">
            Welcome back, {user?.displayName || "Tiger"}!
          </h1>
          <p className="text-xl text-muted-foreground">
            View the most popular petitions or start a new one today.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/create">
            <Button size="lg" className="gap-2">
              <PlusCircle className="h-5 w-5" />
              Create Petition
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="outline" size="lg" className="gap-2">
              <Search className="h-5 w-5" />
              Explore All
            </Button>
          </Link>
          {isAdmin && (
            <Link href="/review">
              <Button variant="outline" size="lg" className="gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Review Queue
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="w-full flex flex-col bg-background text-foreground">
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
          {!isSearchLoading &&
          filteredPetitions.length === 0 &&
          debouncedSearchTerm === "" &&
          selectedFilter === "All" ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-lg">
                No petitions at the moment. Why not start one?
              </p>
            </div>
          ) : (
            <PetitionGrid
              petitions={filteredPetitions}
              isLoading={isSearchLoading}
              onPetitionClick={handlePetitionClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}
