package com.pfe.recrutement.recruitment_platform.controller;

import com.pfe.recrutement.recruitment_platform.dto.RhApplicationResponseDto;
import com.pfe.recrutement.recruitment_platform.model.Application;
import com.pfe.recrutement.recruitment_platform.security.services.ApplicationService;
import com.pfe.recrutement.recruitment_platform.model.ApplicationStatus;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rh/applications")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('RH') or hasRole('ADMIN')")
public class RhApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @GetMapping
    public ResponseEntity<List<Application>> getAllApplications() {
        List<Application> applications = applicationService.getAllApplicationsForRh();
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/by-offer/{offerId}")
    public ResponseEntity<?> getApplicationsByOffer(
            @PathVariable Long offerId,
            @RequestParam(required = false, defaultValue = "false") boolean sortBySimilarity) {
        try {
            List<RhApplicationResponseDto> response;
            if (sortBySimilarity) {
                response = applicationService.getApplicationsByOfferWithSimilarity(offerId);
            } else {
                List<Application> applications = applicationService.getApplicationsByOfferId(offerId);
                response = applications.stream()
                        .map(applicationService::mapToDto)
                        .collect(Collectors.toList());
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors du traitement : " + e.getMessage());
        }
    }

    @GetMapping("/by-offer/{offerId}/best-cv")
    public ResponseEntity<RhApplicationResponseDto> getBestCvForOffer(@PathVariable Long offerId) {
        try {
            List<RhApplicationResponseDto> apps = applicationService.getApplicationsByOfferWithSimilarity(offerId);
            if (apps.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(apps.get(0));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-offer/{offerId}/adapted")
    public ResponseEntity<List<RhApplicationResponseDto>> getAdaptedCvs(
            @PathVariable Long offerId,
            @RequestParam(defaultValue = "0.5") double seuil) {
        try {
            List<RhApplicationResponseDto> all = applicationService
                    .getApplicationsByOfferWithSimilarity(offerId);

            List<RhApplicationResponseDto> adapted = all.stream()
                    .filter(dto -> dto.getSimilarityScore() != null
                            && dto.getSimilarityScore() >= seuil)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(adapted);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PatchMapping("/{applicationId}/status")
    public ResponseEntity<Application> updateApplicationStatus(
            @PathVariable Long applicationId,
            @RequestBody Map<String, String> statusUpdate) {

        String newStatus = statusUpdate.get("status");
        ApplicationStatus status = ApplicationStatus.valueOf(newStatus);

        Application updatedApplication =
                applicationService.updateApplicationStatus(applicationId, status);

        return ResponseEntity.ok(updatedApplication);
    }

    @GetMapping("/{applicationId}/cv")
    public ResponseEntity<byte[]> downloadCv(@PathVariable Long applicationId) {
        try {
            byte[] fileContent = applicationService.downloadCv(applicationId);
            Application application = applicationService.getApplicationById(applicationId);

            String fileName = "CV_" +
                    (application.getCandidate() != null ?
                            application.getCandidate().getFname() + "_" +
                                    application.getCandidate().getLname() :
                            "candidat") +
                    ".pdf";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(fileContent);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{applicationId}/cover-letter")
    public ResponseEntity<byte[]> downloadCoverLetter(@PathVariable Long applicationId) {
        try {
            byte[] fileContent = applicationService.downloadCoverLetter(applicationId);
            Application application = applicationService.getApplicationById(applicationId);

            String fileName = "Lettre_" +
                    (application.getCandidate() != null ?
                            application.getCandidate().getFname() + "_" +
                                    application.getCandidate().getLname() :
                            "candidat") +
                    ".pdf";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(fileContent);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getApplicationsStats() {
        Map<String, Object> stats = applicationService.getApplicationsStatistics();
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/regenerate-embeddings/{offerId}")
    public ResponseEntity<String> regenerateEmbeddingsForOffer(@PathVariable Long offerId) {
        try {
            applicationService.regenerateEmbeddingsForOffer(offerId);
            return ResponseEntity.ok("Régénération des embeddings lancée pour l'offre " + offerId);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur : " + e.getMessage());
        }
    }
}