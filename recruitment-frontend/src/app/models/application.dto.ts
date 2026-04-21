export interface ApplicationDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  cvFile?: File;
  coverLetterFile?: File;
  message?: string;
  offerId: number;
}

export interface CandidateApplicationDto {
  offerId: number;
  cvUrl: string;
  coverLetter: string;
  message?: string;
}

export interface FileApplicationDto {
  offerId: number;
  cvFile: File;
  coverLetterFile: File;
  message?: string;
}
