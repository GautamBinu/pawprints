'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, deleteDoc, addDoc, getDoc } from 'firebase/firestore';
import { getFirestore } from '@/app/auth/firebase';
import { Petition } from '@/types/petition';
import { useAuth } from '@/app/auth/AuthContext';
import AdminGuard from '@/components/AdminGuard/AdminGuard';

interface PendingPetition extends Omit<Petition, 'id'> {
  id: string;
}

function ReviewPageContent() {
  const [pendingPetitions, setPendingPetitions] = useState<PendingPetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { user } = useAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchPendingPetitions();
  }, []);

  const fetchPendingPetitions = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'pending'));
      const petitions: PendingPetition[] = [];

      querySnapshot.forEach((doc) => {
        petitions.push({
          id: doc.id,
          ...doc.data()
        } as PendingPetition);
      });

      setPendingPetitions(petitions);
    } catch (error) {
      console.error('Error fetching pending petitions:', error);
      alert('Failed to load pending petitions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (petition: PendingPetition) => {
    if (!confirm(`Are you sure you want to approve "${petition.title}"?`)) {
      return;
    }

    setProcessing(petition.id);
    try {
      // Ensure petition.id is a string
      const petitionId = String(petition.id);
      
      // Add to petitions collection
      const { id, ...petitionData } = petition;

      // Remove undefined fields for Firestore
      const cleanData: any = { ...petitionData };
      if (cleanData.expiresDate === undefined) {
        delete cleanData.expiresDate;
      }

      await addDoc(collection(db, 'petitions'), cleanData);

      // Remove from pending collection
      await deleteDoc(doc(db, 'pending', petitionId));

      // Update local state
      setPendingPetitions(prev => prev.filter(p => p.id !== petition.id));

      alert('Petition approved and published!');
    } catch (error) {
      console.error('Error approving petition:', error);
      alert('Failed to approve petition');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (petition: PendingPetition) => {
    const reason = prompt(`Please provide a reason for rejecting "${petition.title}":`);
    if (reason === null) return; // User cancelled

    setProcessing(petition.id);
    try {
      // Ensure petition.id is a string
      const petitionId = String(petition.id);
      
      // Delete from pending collection
      await deleteDoc(doc(db, 'pending', petitionId));

      // Update local state
      setPendingPetitions(prev => prev.filter(p => p.id !== petition.id));

      // TODO: You could send an email notification to the petition author with the reason
      console.log(`Petition rejected. Reason: ${reason}`);

      alert('Petition rejected and removed.');
    } catch (error) {
      console.error('Error rejecting petition:', error);
      alert('Failed to reject petition');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending petitions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-orange-500 font-bold text-4xl mb-2">Review Pending Petitions</h1>
          <p className="text-gray-600 text-lg">
            Review and moderate petition submissions before they are published.
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Petitions</p>
              <p className="text-3xl font-bold text-orange-500">{pendingPetitions.length}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-sm">Reviewer</p>
              <p className="text-lg font-semibold">{user?.displayName || user?.email || 'Admin'}</p>
            </div>
          </div>
        </div>

        {/* Petitions List */}
        {pendingPetitions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pending Petitions</h3>
            <p className="text-gray-500">All petitions have been reviewed!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingPetitions.map((petition) => (
              <div key={petition.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                          {petition.category}
                        </span>
                        <span className="text-gray-500 text-sm">
                          by {petition.author}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {petition.title}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Submitted: {new Date(petition.createdDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Target: {petition.targetSignatures} signatures</span>
                        {petition.expiresDate && (
                          <>
                            <span>•</span>
                            <span>Expires: {new Date(petition.expiresDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-2">Description:</h3>
                    <div
                      className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-4 rounded-lg"
                      dangerouslySetInnerHTML={{ __html: petition.description }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleApprove(petition)}
                      disabled={processing === petition.id}
                      className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processing === petition.id ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve & Publish
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(petition)}
                      disabled={processing === petition.id}
                      className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    // <AdminGuard>
    <ReviewPageContent />
    // </AdminGuard>
  );
}
