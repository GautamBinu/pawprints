import React from 'react';
import { PetitionUpdate } from '../../types/petition';

interface PetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  petition: {
    title: string;
    description: string;
    author: string;
    createdDate: string;
    currentSignatures: number;
    targetSignatures: number;
    category: string;
    status: 'active' | 'in_progress';
    timePosted: string;
    expiresDate?: string;
    updates?: PetitionUpdate[];
  } | null;
}

// Category color mapping
const CATEGORY_COLORS = {
  housing: 'bg-orange-100 text-orange-800 border-orange-200',
  dining: 'bg-blue-100 text-blue-800 border-blue-200',
  'campus life': 'bg-green-100 text-green-800 border-green-200',
  facilities: 'bg-purple-100 text-purple-800 border-purple-200',
  governance: 'bg-gray-100 text-gray-800 border-gray-200',
  other: 'bg-yellow-100 text-yellow-800 border-yellow-200'
} as const;

const PetitionModal: React.FC<PetitionModalProps> = ({ isOpen, onClose, petition }) => {
  if (!isOpen || !petition) return null;

  const progressPercentage = Math.min((petition.currentSignatures / petition.targetSignatures) * 100, 100);
  const isThresholdMet = petition.currentSignatures >= petition.targetSignatures;
  const statusInfo = {
    text: isThresholdMet ? 'In Progress' : 'Active',
    color: isThresholdMet ? 'text-green-600' : 'text-orange-600'
  };
  const categoryColor = CATEGORY_COLORS[petition.category.toLowerCase() as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.other;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleOverlayClick}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 p-6 relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light"
          >
            ×
          </button>
          <div className="pr-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {petition.title}
            </h1>
            <p className="text-gray-600 text-sm">
              Petition by {petition.author}
            </p>
          </div>
        </div>

        {/* Content - Scrollable Middle Section */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg">
            <div className="space-y-6">
              {/* Updates Timeline */}
              {petition.updates?.map((update) => (
                <div key={update.id} className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-orange-500 font-semibold text-sm uppercase tracking-wide">
                        {update.type}
                      </h3>
                      <span className="text-gray-500 text-xs">{update.timePosted}</span>
                    </div>
                    
                    {update.title && (
                      <h4 className="font-semibold text-gray-900 mb-3">{update.title}</h4>
                    )}
                    
                    <div 
                      className="text-gray-800 text-sm leading-relaxed mb-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: update.content }}
                    />
                    
                    <div className="text-xs text-gray-500 font-medium">
                      {update.author}
                    </div>
                  </div>
                </div>
              ))}

              {/* Petition Description */}
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mt-2"></div>
                </div>
                <div className="flex-1 bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-orange-500 font-semibold text-sm uppercase tracking-wide">
                      PETITION DESCRIPTION
                    </h3>
                    <span className="text-gray-500 text-xs">{petition.timePosted}</span>
                  </div>
                  
                  <div 
                    className="text-gray-800 text-sm leading-relaxed mb-3 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: petition.description }}
                  />
                  
                  <div className="flex justify-end">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${categoryColor}`}>
                      {petition.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Petition Created Entry */}
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mt-1"></div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-400 italic font-normal opacity-70">
                    Created by {petition.author} on {petition.createdDate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Fixed */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white">
          {/* Signatures */}
          <div className="px-4 py-3 bg-white">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 mb-2">
                {petition.currentSignatures} / {petition.targetSignatures} Signatures
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-300 ${progressPercentage >= 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Status Info and Sign Button */}
          <div className="px-4 py-3 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 items-center">
              {/* Left Column - Status Info */}
              <div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex flex-col">
                    <span className="text-gray-600 font-medium">Status</span>
                    <span className={`font-semibold ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600 font-medium">Created</span>
                    <span className="text-gray-900 font-medium">{petition.createdDate}</span>
                  </div>
                  {petition.expiresDate && (
                    <>
                      <div className="flex flex-col">
                        <span className="text-gray-600 font-medium">Expires</span>
                        <span className="text-gray-900 font-medium">{petition.expiresDate}</span>
                      </div>
                      <div></div> {/* Empty cell for grid alignment */}
                    </>
                  )}
                </div>
              </div>
              
              {/* Right Column - Sign Button */}
              <div className="flex justify-end">
                <button className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-md transition-colors whitespace-nowrap shadow-md hover:shadow-lg">
                  LOG IN TO SIGN
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetitionModal;