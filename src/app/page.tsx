'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useAuth } from '@/app/auth/AuthContext';
import { SearchBar, PetitionGrid, SearchResults, PetitionModal } from "@/components";
import { useDebounce } from "@/hooks/useDebounce";
import { getPetitions } from '@/app/actions';
import { Petition } from '@/types/petition';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

function HomeContent() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [petitions, setPetitions] = useState<Petition[]>([]);
  
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Fetch petitions from Server Action
  useEffect(() => {
    async function fetchPetitions() {
      try {
        const fetchedPetitions = await getPetitions();
        setPetitions(fetchedPetitions);
      } catch (error) {
        console.error('Error fetching petitions:', error);
      } finally {
        setIsInitialLoading(false);
      }
    }

    fetchPetitions();
  }, []);

  // Sync URL to State
  useEffect(() => {
    const petitionId = searchParams.get('petitionId');
    if (petitionId && petitions.length > 0) {
      const petition = petitions.find(p => p.id === parseInt(petitionId));
      if (petition) {
        setSelectedPetition(petition);
        setIsModalOpen(true);
      } else {
        // Petition not found (invalid ID or not published)
        setIsModalOpen(false);
        setSelectedPetition(null);
      }
    } else if (!petitionId) {
      setIsModalOpen(false);
      setSelectedPetition(null);
    }
  }, [searchParams, petitions]);

  const handlePetitionClick = (petition: Petition) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('petitionId', petition.id.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCloseModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('petitionId');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
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

  const isLoading = isInitialLoading || isSearchLoading;

  // Filter petitions based on debounced search term and selected filter
  const filteredPetitions = useMemo(() => {
    // Show all petitions by default when no search is active
    if (debouncedSearchTerm === '' && selectedFilter === 'All') {
      return petitions;
    }

    return petitions.filter(petition => {
      // Filter by search term (title search)
      const matchesSearch = debouncedSearchTerm === '' ||
        petition.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      // Filter by category
      const matchesFilter = selectedFilter === 'All' ||
        petition.tags.some(tag => tag.name.toLowerCase() === selectedFilter.toLowerCase());

      return matchesSearch && matchesFilter;
    });
  }, [debouncedSearchTerm, selectedFilter, petitions]);

  return (
    <div className="w-full flex flex-col px-4 sm:px-8 lg:px-20 py-10" style={{ backgroundColor: '#FFFFFF' }}>
      <SearchBar
        onSearchChange={setSearchTerm}
        onFilterChange={setSelectedFilter}
        searchTerm={searchTerm}
        selectedFilter={selectedFilter}
      />
      <div className="flex flex-col mt-8 w-full">
        <SearchResults
          isLoading={isLoading}
          resultsCount={filteredPetitions.length}
          searchTerm={debouncedSearchTerm}
          selectedFilter={selectedFilter}
        />
        <PetitionGrid 
          petitions={filteredPetitions} 
          isLoading={isLoading} 
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

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
