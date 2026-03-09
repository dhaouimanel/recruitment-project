package com.pfe.recrutement.recruitment_platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApplicationEmailDTO {

    private Long applicationId;

    private String candidateName;

    private String candidateEmail;

    private String offerTitle;

    private String emailType;

    private Map<String, String> customData;
}
