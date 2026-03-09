package com.pfe.recrutement.recruitment_platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApplicationDto {
    private Long offerId;

    private String firstName;

    private String lastName;

    private String email;

    private String phone;
    private String cvUrl;
    private String coverLetter;
    private String cvPath;
    private String coverLetterPath;
    private String message;


    public ApplicationDto(Long offerId, String cvPath, String coverLetterPath, String message) {
        this.offerId = offerId;
        this.cvPath = cvPath;
        this.coverLetterPath = coverLetterPath;
        this.message = message;
    }


    public ApplicationDto(Long offerId, String cvUrl, String coverLetter) {
        this.offerId = offerId;
        this.cvUrl = cvUrl;
        this.coverLetter = coverLetter;
    }
}