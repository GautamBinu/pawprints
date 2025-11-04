'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/app/auth/AuthContext';
import { SearchBar, PetitionGrid, SearchResults } from "@/components";
import { useDebounce } from "@/hooks/useDebounce";
import { getFirestore } from '@/app/auth/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Petition } from '@/types/petition';

import moment from 'moment';

export default function Home() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [petitions, setPetitions] = useState<Petition[]>([]); // Start with dummy data, will be replaced with Firestore data

  // Fetch petitions from Firestore
  useEffect(() => {
    async function fetchPetitions() {
      try {
        const db = getFirestore();
        const petitionsCollection = collection(db, 'petitions');
        const querySnapshot = await getDocs(petitionsCollection);

        const fetchedPetitions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Petition[];

        // Convert createdDate to just the date and make timePosted property a relative date
        fetchedPetitions.forEach(petition => {
          const createdDateValue = petition.createdDate as any;
          
          // Check if it's a Firebase Timestamp
          if (createdDateValue && typeof createdDateValue === 'object' && 'seconds' in createdDateValue) {
            // Firebase Timestamp
            const milliseconds =
              createdDateValue.seconds * 1000 +
              createdDateValue.nanoseconds / 1000000;
            petition.createdDate = moment(milliseconds).format('YYYY-MM-DD');
            petition.timePosted = moment(milliseconds).fromNow();
          } else if (typeof createdDateValue === 'string') {
            // ISO string or regular date string
            const date = moment(createdDateValue);
            if (date.isValid()) {
              petition.createdDate = date.format('YYYY-MM-DD');
              petition.timePosted = date.fromNow();
            }
          }
        });

        console.log('Fetched petitions:', fetchedPetitions);
        setPetitions(fetchedPetitions);
      } catch (error) {
        console.error('Error fetching petitions:', error);
        // Keep the dummy data if there's an error
      } finally {
        setIsLoading(false);
      }
    }

    fetchPetitions();
  }, []);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);

  // Show loading state when search term changes
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  // Filter petitions based on debounced search term and selected filter
  const filteredPetitions = useMemo(() => {
    if (isLoading) return [];

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
        petition.category.toLowerCase() === selectedFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [debouncedSearchTerm, selectedFilter, isLoading, petitions]);

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
        {!isLoading && (
          <PetitionGrid petitions={filteredPetitions} />
        )}
      </div>
    </div>
  );
}
