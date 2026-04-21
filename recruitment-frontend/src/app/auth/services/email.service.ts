import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApplicationEmailDTO {
  applicationId?: number;
  candidateName: string;
  candidateEmail: string;
  offerTitle?: string;
  emailType: 'interview' | 'rejection' | 'info' | 'generic' | 'meeting';
  customData: {
    [key: string]: string | undefined;
    interviewDate?: string;
    interviewTime?: string;
    interviewLocation?: string;
    rejectionReason?: string;
    message?: string;
    meetingDate?: string;
    meetingStartTime?: string;
    meetingDuration?: string;
    meetingType?: string;
    meetingLink?: string;
    additionalAttendees?: string;
    additionalInstructions?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  sendEmailToCandidate(emailData: ApplicationEmailDTO): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/emails/send-to-candidate`,
      emailData,
      {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'text',
      },
    );
  }

  sendBulkEmails(emails: ApplicationEmailDTO[]): Observable<string> {
    return this.http.post(`${this.apiUrl}/emails/send-bulk`, emails, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'text',
    });
  }
}
