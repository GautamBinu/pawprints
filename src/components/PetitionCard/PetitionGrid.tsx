'use client';

import React, { useState } from 'react';
import PetitionCard from './PetitionCard';
import { PetitionModal } from '../index';
import { Petition } from '../../types/petition';

interface PetitionGridProps {
  petitions: Petition[];
}

const PetitionGrid: React.FC<PetitionGridProps> = ({ petitions }) => {
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePetitionClick = (petition: Petition) => {
    setSelectedPetition(petition);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPetition(null);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        {petitions.map((petition) => (
          <PetitionCard
            key={petition.id}
            title={petition.title}
            currentSignatures={petition.currentSignatures}
            targetSignatures={petition.targetSignatures}
            category={petition.category}
            status={petition.status}
            onClick={() => handlePetitionClick(petition)}
          />
        ))}
      </div>
      
      <PetitionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        petition={selectedPetition}
      />
    </div>
  );
};

export default PetitionGrid;
