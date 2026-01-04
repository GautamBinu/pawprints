import { Petition } from "./petition";

export interface NotificationSettings {
  id: number;
  userId: string;
  update: boolean;
  response: boolean;
  reported: boolean;
  threshold: boolean;
}

export interface GlobalAlert {
  id: number;
  active: boolean;
  content: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  displayName: string | null;
  hasAccess: number;
  createdPetitions: Petition[];
  signedPetitions: Petition[];
  subscriptions: Petition[];
  notificationSettings: NotificationSettings | null;
  createdAt: Date;
  updatedAt: Date;
}
