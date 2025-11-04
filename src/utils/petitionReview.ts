import { collection, doc, deleteDoc, addDoc, getDocs } from 'firebase/firestore';
import { getFirestore } from '@/app/auth/firebase';
import { Petition } from '@/types/petition';

export interface PendingPetition extends Omit<Petition, 'id'> {
  id: string;
}

/**
 * Fetch all pending petitions awaiting review
 */
export async function fetchPendingPetitions(): Promise<PendingPetition[]> {
  const db = getFirestore();
  const querySnapshot = await getDocs(collection(db, 'pending'));
  const petitions: PendingPetition[] = [];
  
  querySnapshot.forEach((doc) => {
    petitions.push({
      id: doc.id,
      ...doc.data()
    } as PendingPetition);
  });
  
  return petitions;
}

/**
 * Approve a pending petition and move it to the main petitions collection
 */
export async function approvePetition(petitionId: string, petitionData: Omit<Petition, 'id'>): Promise<void> {
  const db = getFirestore();
  
  // Add to petitions collection
  await addDoc(collection(db, 'petitions'), petitionData);
  
  // Remove from pending collection
  await deleteDoc(doc(db, 'pending', petitionId));
}

/**
 * Reject a pending petition and remove it from the pending collection
 */
export async function rejectPetition(petitionId: string, reason?: string): Promise<void> {
  const db = getFirestore();
  
  // TODO: Optionally store rejection in a 'rejected' collection with reason
  // This would allow tracking and potential appeals
  if (reason) {
    console.log(`Petition ${petitionId} rejected. Reason: ${reason}`);
    // await addDoc(collection(db, 'rejected'), {
    //   petitionId,
    //   reason,
    //   rejectedAt: new Date().toISOString(),
    //   rejectedBy: user?.uid
    // });
  }
  
  // Delete from pending collection
  await deleteDoc(doc(db, 'pending', petitionId));
}

/**
 * Submit a new petition to the pending collection for review
 */
export async function submitPetitionForReview(petitionData: Omit<Petition, 'id'>): Promise<string> {
  const db = getFirestore();
  const docRef = await addDoc(collection(db, 'pending'), petitionData);
  return docRef.id;
}
