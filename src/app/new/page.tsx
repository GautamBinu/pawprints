'use client';

import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import PetitionForm, { PetitionFormData } from '@/components/PetitionForm/PetitionForm';
import { Petition } from '@/types/petition';
import { collection, addDoc } from 'firebase/firestore';
import { getFirestore } from '@/app/auth/firebase';
import { useRouter } from 'next/navigation';

export default function New() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const db = getFirestore();

  const handleSubmit = async (data: PetitionFormData) => {
    setIsSubmitting(true);
    
    try {
      const now = new Date();
      const createdDate = now.toISOString();
      
      // Prepare complete petition data matching Petition interface
      const petitionData: Omit<Petition, 'id'> = {
        title: data.title,
        description: data.description,
        author: user?.displayName || user?.email || 'Anonymous',
        createdDate: createdDate,
        currentSignatures: 0,
        targetSignatures: data.targetSignatures,
        category: data.category,
        status: 'active',
        timePosted: now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        updates: []
      };

      // Only add expiresDate if it has a value (Firestore doesn't accept undefined)
      if (data.expiresDate) {
        petitionData.expiresDate = data.expiresDate;
      }
      
      // Save to pending collection for admin review
      const docRef = await addDoc(collection(db, 'pending'), petitionData);
      console.log('Petition submitted for review with ID:', docRef.id);
      
      alert('Petition submitted successfully! It will be reviewed by an administrator before being published.');
      router.push('/');
    } catch (error) {
      console.error('Error creating petition:', error);
      alert('Failed to create petition. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-black">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-orange-500 font-bold text-4xl mb-2">Create New Petition</h1>
          <p className="text-gray-600 text-lg">
            Make your voice heard. Start a petition to bring about positive change at RIT.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <PetitionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Tips for a successful petition:</h3>
          <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside mb-4">
            <li>Be specific about what you want to achieve</li>
            <li>Explain why this change matters to the RIT community</li>
            <li>Keep your language professional and respectful</li>
            <li>Provide facts and evidence when possible</li>
          </ul>
          
          <div className="border-t border-blue-300 pt-4 mt-4">
            <h3 className="font-semibold text-blue-900 mb-3">Code of Conduct & Guidelines:</h3>
            <div className="text-blue-800 text-sm space-y-3">
              <p>
                Use of this site falls under the <span className="font-semibold">RIT Code of Conduct for Computer and Network Use</span>.
              </p>
              
              <p>
                Student Government reserves the right to edit or remove any petition at any time for violating the Code of Conduct. 
                This includes, but is not limited to, creating an intimidating, hostile or abusive environment for any member of the 
                RIT community, or posting of any obscene, defamatory, threatening, or otherwise harassing petitions.
              </p>
              
              <p>
                When using this service, you agree to sign petitions from only one RIT Computer Account. Should you have access to 
                more than one account, you will only sign from your primary student, faculty, or staff account.
              </p>
              
              <p className="font-semibold">
                Please exercise good judgment when using this service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}