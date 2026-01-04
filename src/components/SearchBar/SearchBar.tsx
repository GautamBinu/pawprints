'use client';
import React, { useState } from 'react';
import { Input } from '../ui/input';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../ui/input-group';
import { SearchIcon } from 'lucide-react';
import { ButtonGroup } from '../ui/button-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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
    console.log(value)
    setLocalSelectedFilter(value);
    onFilterChange?.(value);
  };

  return (
    <div className="w-full">
      <ButtonGroup className="w-full">
        <InputGroup className="w-2/3">
          <InputGroupInput type="text" placeholder="Search petitions" value={localSearchTerm} onChange={(e: { target: { value: string; }; }) => handleSearchChange(e.target.value)} />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <InputGroupButton disabled={localSearchTerm.trim() === ''} onClick={() => handleSearchChange(localSearchTerm)}>Search</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        <Select onValueChange={handleFilterChange}>
          <SelectTrigger className="w-1/3">
            <SelectValue placeholder={`Filter: ${localSelectedFilter}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Technology">Technology</SelectItem>
            <SelectItem value="Academics">Academics</SelectItem>
            <SelectItem value="Parking & Transportation">Parking & Transportation</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
            <SelectItem value="Dining">Dining</SelectItem>
            <SelectItem value="Sustainability">Sustainability</SelectItem>
            <SelectItem value="Facilities">Facilities</SelectItem>
            <SelectItem value="Housing">Housing</SelectItem>
            <SelectItem value="Public Safety">Public Safety</SelectItem>
            <SelectItem value="Campus Life">Campus Life</SelectItem>
            <SelectItem value="Governance">Governance</SelectItem>
            <SelectItem value="Clubs & Organizations">Clubs & Organizations</SelectItem>
            <SelectItem value="Deaf Advocacy">Deaf Advocacy</SelectItem>
          </SelectContent>
        </Select>
      </ButtonGroup>
    </div>
  );
};

export default SearchBar;
