export type ApplicationStatus =
  | 'A_CONTACTER'
  | 'RETENUE'
  | 'ELIMINE'
  | 'RECRUTE';

export interface Application {
  id: number;
  applicationDate: Date;
  status: ApplicationStatus;
  message?: string;

  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
  };

  offerId: number;
  offerTitle: string;

  cvFileName?: string;
  coverLetterFileName?: string;

  candidateNotes?: string;
  interviewDate?: Date;
  rating?: number;
}

export interface ApplicationResponse {
  id: number;
  offerId: number;
  offerTitle?: string;
  candidateId: number;
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  candidatePhone?: string;
  message?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  cvFileName?: string;
  coverLetterFileName?: string;
  applicationDate?: string;

  candidateNotes?: string;
  interviewDate?: string;
  rating?: number;

  similarityScore?: number;
}

export interface CandidateApplicationWithScoreDto {
  id: number;
  status: ApplicationStatus;
  applicationDate: string;
  message?: string;
  similarityScore: number;
  offer: {
    id: number;
    title: string;
    description: string;
    location: string;
    published: boolean;
    createDate: string;
  };
}
