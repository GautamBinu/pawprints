export interface PetitionUpdate {
  id: string;
  type: 'OFFICIAL UPDATE' | 'GENERAL UPDATE';
  title?: string;
  content: string;
  author: string;
  date: string;
  timePosted: string;
}

export interface Petition {
  id: string;
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
}
