import React from 'react';
import PetitionCard from './PetitionCard';

interface Petition {
  id: string;
  title: string;
  currentSignatures: number;
  targetSignatures: number;
  category: string;
  status?: 'active' | 'threshold_met';
}

interface PetitionGridProps {
  petitions: Petition[];
}

const PetitionGrid: React.FC<PetitionGridProps> = ({ petitions }) => {
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
          />
        ))}
      </div>
    </div>
  );
};

export default PetitionGrid;
