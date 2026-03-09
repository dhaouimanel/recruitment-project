package com.pfe.recrutement.recruitment_platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CandidateApplicationDto {

    private Long offerId;

    private String cvUrl;

    private String coverLetter;
}