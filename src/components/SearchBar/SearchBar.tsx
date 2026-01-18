"use client";
import React, { useState } from "react";
import { Input } from "../ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group";
import { SearchIcon } from "lucide-react";
import { ButtonGroup } from "../ui/button-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface SearchBarProps {
  onSearchChange?: (searchTerm: string) => void;
  onFilterChange?: (filter: string) => void;
  searchTerm?: string;
  selectedFilter?: string;
}

const categories = [
  "Academic Affairs",
  "Student Services",
  "Campus Life (SG, Clubs, & Organizations)",
  "Facilities & Parking",
  "Technology",
  "Housing",
  "Dining Services / Cafeteria",
  "Commuter Transportation",
  "Health & Wellness",
  "Safety & Security",
  "Accessibility & Inclusion",
  "Sustainability",
  "Financial Services",
  "Library & Learning Resources",
  "Career Services",
  "Other",
];

const SearchBar: React.FC<SearchBarProps> = ({
  onSearchChange,
  onFilterChange,
  searchTerm = "",
  selectedFilter = "All",
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [localSelectedFilter, setLocalSelectedFilter] =
    useState(selectedFilter);

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
    onSearchChange?.(value);
  };

  const handleFilterChange = (value: string) => {
    console.log(value);
    setLocalSelectedFilter(value);
    onFilterChange?.(value);
  };

  return (
    <div className="w-full">
      <ButtonGroup className="w-full">
        <InputGroup className="w-2/3">
          <InputGroupInput
            type="text"
            placeholder="Search petitions"
            value={localSearchTerm}
            onChange={(e: { target: { value: string } }) =>
              handleSearchChange(e.target.value)
            }
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              disabled={localSearchTerm.trim() === ""}
              onClick={() => handleSearchChange(localSearchTerm)}
            >
              Search
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        <Select onValueChange={handleFilterChange}>
          <SelectTrigger className="w-1/3">
            <SelectValue placeholder={`Filter: ${localSelectedFilter}`} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ButtonGroup>
    </div>
  );
};

export default SearchBar;
