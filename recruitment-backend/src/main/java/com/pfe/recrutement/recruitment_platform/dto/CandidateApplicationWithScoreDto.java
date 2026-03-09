package com.pfe.recrutement.recruitment_platform.dto;

import com.pfe.recrutement.recruitment_platform.model.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateApplicationWithScoreDto {

    private Long id;

    private ApplicationStatus status;

    private LocalDateTime applicationDate;

    private String message;

    private Double similarityScore;

    private Map<String, Object> offer;
}