package com.pfe.recrutement.recruitment_platform.dto;

import com.pfe.recrutement.recruitment_platform.model.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RhApplicationResponseDto {

    private Long id;

    private Long offerId;

    private String offerTitle;

    private Long candidateId;

    private String candidateFirstName;

    private String candidateLastName;

    private String candidateEmail;

    private String candidatePhone;

    private String cvFileName;

    private String coverLetterFileName;

    private String message;

    private ApplicationStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Double similarityScore;
}
