'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/app/auth/AuthContext';
import { SearchBar, PetitionGrid, SearchResults } from "@/components";
import { useDebounce } from "@/hooks/useDebounce";

const allPetitions = [
  {
    id: '1',
    title: 'Move Door Locks On High-Rise Res Halls Inside',
    currentSignatures: 10,
    targetSignatures: 200,
    category: 'Housing',
    status: 'active' as const,
    createdDate: '2024-01-15',
    description: 'The door locks on the high-rise residence halls (Grace Watson, James E. Booth, and George Eastman) are currently located on the outside of the doors. This poses a security risk as anyone can easily unlock the doors from the outside. Moving the locks to the inside of the doors would greatly improve the safety and security of the residents.',
    author: 'Housing Resident',
    timePosted: '8 Months Ago'
  },
  {
    id: '2',
    title: 'Petition For Air Conditioning In Mark Ellingson Hall During April And May',
    currentSignatures: 143,
    targetSignatures: 200,
    category: 'Housing',
    status: 'active' as const,
    createdDate: '2024-03-10',
    description: 'Mark Ellingson Hall needs air conditioning during the warmer months of April and May when temperatures can become uncomfortable for residents.',
    author: 'Student Resident',
    timePosted: '6 Months Ago'
  },
  {
    id: '3',
    title: '175 Jefferson Meals',
    currentSignatures: 71,
    targetSignatures: 200,
    category: 'Campus Life',
    status: 'active' as const,
    createdDate: '2024-02-20',
    description: 'Improve meal options and quality at 175 Jefferson dining location.',
    author: 'Campus Dining Student',
    timePosted: '7 Months Ago'
  },
  {
    id: '4',
    title: 'Bring Water Cups Back To Cantina',
    currentSignatures: 156,
    targetSignatures: 200,
    category: 'Dining',
    status: 'active' as const,
    createdDate: '2024-04-01',
    description: 'Bring back water cups to the Cantina dining location for student convenience.',
    author: 'Dining Student',
    timePosted: '5 Months Ago'
  },
  {
    id: '5',
    title: 'Put Trash Cans In All The Classrooms',
    currentSignatures: 10,
    targetSignatures: 200,
    category: 'Facilities',
    status: 'active' as const,
    createdDate: '2024-05-15',
    description: 'Every classroom should have trash cans for proper waste disposal.',
    author: 'Student',
    timePosted: '4 Months Ago'
  },
  {
    id: '6',
    title: 'More Feminine Products In Women\'s Bathrooms',
    currentSignatures: 19,
    targetSignatures: 200,
    category: 'Campus Life',
    status: 'active' as const,
    createdDate: '2024-06-01',
    description: 'Increase availability of feminine hygiene products in women\'s restrooms across campus.',
    author: 'Student Advocate',
    timePosted: '3 Months Ago'
  },
  {
    id: '7',
    title: 'More Outdoor Seating For Accessibility',
    currentSignatures: 42,
    targetSignatures: 200,
    category: 'Campus Life',
    status: 'active' as const,
    createdDate: '2024-07-10',
    description: 'Add more accessible outdoor seating areas around campus for students with mobility needs.',
    author: 'Accessibility Advocate',
    timePosted: '2 Months Ago'
  },
  {
    id: '8',
    title: 'The Double Standard Of Lowering The US Flag On The RIT Campus',
    currentSignatures: 278,
    targetSignatures: 200,
    category: 'Governance',
    status: 'in_progress' as const,
    createdDate: 'September 12, 2025',
    description: 'RIT is not acting as a politically neutral campus as they claim to be by showing double standards on the height of the US flag on campus and need to be transparent on the motives of lowering the flag.',
    author: 'Eva Mattison',
    timePosted: '11 Days Ago',
    updates: [
      {
        id: 'update1',
        type: 'OFFICIAL UPDATE' as const,
        title: 'Hello!',
        content: 'Thank you all for signing this petition. This Pawprint was charged to the Student Affairs committee on Sep 19, 2025, chaired by Noah Manning (nmmsg@rit.edu). Student Government invites you to attend this committee meeting, which is held weekly on Thursdays 10 AM to 11 AM in the Kathy Hall Conference Room (CPC 1730), attached to the SG office.\n\nWe look forward to meeting you!\n\nAll the best,\nTrishelle Hoopes\nDirector of Student Relations 2025-2026',
        author: 'Trishelle Hoopes',
        date: 'September 20, 2025',
        timePosted: '3 Days Ago'
      }
    ]
  },
  {
    id: '9',
    title: 'Swing Set For Tall People',
    currentSignatures: 31,
    targetSignatures: 200,
    category: 'Campus Life',
    status: 'active' as const,
    createdDate: '2024-08-20',
    description: 'Install swing sets designed for taller individuals on campus recreational areas.',
    author: 'Tall Student Coalition',
    timePosted: '1 Month Ago'
  }
];

export default function Home() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  
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
      return allPetitions;
    }
    
    return allPetitions.filter(petition => {
      // Filter by search term (title search)
      const matchesSearch = debouncedSearchTerm === '' || 
        petition.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      // Filter by category
      const matchesFilter = selectedFilter === 'All' || 
        petition.category.toLowerCase() === selectedFilter.toLowerCase();
      
      return matchesSearch && matchesFilter;
    });
  }, [debouncedSearchTerm, selectedFilter, isLoading]);

  return (
    <div className="w-full flex flex-col px-4 sm:px-8 lg:px-20 py-10" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Debug: Show user info */}
      <div className="mb-4 text-sm text-gray-700">
        <strong>User:</strong> {user ? user.displayName || user.email || user.uid : 'Not signed in'}<br />
        <strong>PhotoURL:</strong> {user && user.photoURL ? user.photoURL : 'N/A'}
      </div>
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
