import React from 'react';

interface PetitionCardProps {
  title: string;
  currentSignatures: number;
  targetSignatures: number;
  category: string;
  status?: 'active' | 'in_progress';
  onClick?: () => void;
}

const PetitionCard: React.FC<PetitionCardProps> = ({
  title,
  currentSignatures,
  targetSignatures,
  category,
  status = 'active',
  onClick
}) => {
  const progressPercentage = Math.min((currentSignatures / targetSignatures) * 100, 100);
  const remainingSignatures = Math.max(targetSignatures - currentSignatures, 0);
  
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'housing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'dining':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'campus life':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'facilities':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'governance':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'other':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressBarColor = () => {
    if (currentSignatures >= targetSignatures) {
      return 'bg-green-500';
    }
    return 'bg-orange-500';
  };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-in-out h-full flex flex-col cursor-pointer"
      onClick={onClick}
    >
      {/* Signatures and status */}
      <div className="mb-3">
        <div className="text-sm text-gray-600 mb-1">
          {currentSignatures} Signatures | <span className="font-bold text-gray-800">
            {currentSignatures >= targetSignatures ? 'Thershold Met' : 
             `Needs ${remainingSignatures} More`}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4 leading-tight flex-grow">
        {title}
      </h3>

      {/* Category tag */}
      <div className="mb-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(category)}`}>
          {category}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full mt-auto">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default PetitionCard;
