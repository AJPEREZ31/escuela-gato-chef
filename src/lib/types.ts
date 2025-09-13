import { Timestamp } from 'firebase/firestore';

export type Course = {
  id: string;
  name: string;
  createdAt: Timestamp;
  dateRange?: {
    from: Date;
    to?: Date;
  };
};


export type Student = {
  id: string;
  name: string;
  phone: string;
  onAccount: number;
  balance: number;
  total: number;
  course: string;
  qrPaymentUrl?: string; // This will now be client-side only (generated from file) or empty
  qrPaymentFileName?: string;
  videoUrl?: string;
  videoFileName?: string;
  hasVideo?: boolean;
  observations: string;
  createdAt: Timestamp;
};
