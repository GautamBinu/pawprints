import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

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
    <Card
      className="h-full flex flex-col hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
      onClick={onClick}
    >
      <CardHeader className="font-mono uppercase">
        <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
          <span>{currentSignatures} Signatures</span>
          <span className="font-medium text-foreground">
            {currentSignatures >= targetSignatures ? 'Threshold Met' : `Needs ${remainingSignatures} More`}
          </span>
        </div>

      </CardHeader>

      <CardContent className="flex-grow py-2">
        <CardTitle className="text-lg leading-tight">{title}</CardTitle>
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-4 pb-6">
        <Badge variant="outline" className={`font-normal ${getCategoryColor(category)}`}>
          {category}
        </Badge>
      </CardFooter>
      <div className="absolute bottom-0 left-0 w-full h-2 bg-muted">
        <div 
          className={`h-full transition-all duration-300 ${getProgressBarColor()}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </Card>
  );
};

export default PetitionCard;
