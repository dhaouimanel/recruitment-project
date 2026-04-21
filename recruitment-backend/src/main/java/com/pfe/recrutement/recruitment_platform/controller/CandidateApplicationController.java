package com.pfe.recrutement.recruitment_platform.controller;
import com.pfe.recrutement.recruitment_platform.dto.ApplicationDto;
import com.pfe.recrutement.recruitment_platform.dto.CandidateApplicationWithScoreDto;
import com.pfe.recrutement.recruitment_platform.model.Application;
import com.pfe.recrutement.recruitment_platform.security.services.ApplicationService;
import com.pfe.recrutement.recruitment_platform.security.services.FileStorageService;
import jakarta.annotation.Resource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/candidate/applications")
@CrossOrigin(origins = "http://localhost:4200")
@PreAuthorize("hasRole('CANDIDAT')")
public class CandidateApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private FileStorageService fileStorageService;


    @PostMapping
    public ResponseEntity<?> apply(@RequestBody ApplicationDto applicationDto,
                                   Authentication authentication) {
        try {
            String username = authentication.getName();
            Application application = applicationService.createApplication(applicationDto, username);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping(value = "/with-files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> applyWithFiles(
            @RequestParam("cvFile") MultipartFile cvFile,
            @RequestParam("coverLetterFile") MultipartFile coverLetterFile,
            @RequestParam("offerId") Long offerId,
            @RequestParam(value = "message", required = false) String message,
            Authentication authentication) {

        try {

            String username = authentication.getName();

            validateFile(cvFile, "CV", new String[]{"application/pdf"});
            validateFile(coverLetterFile, "Lettre de motivation",
                    new String[]{"application/pdf", "application/msword",
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"});


            Application application = applicationService.createApplicationWithFiles(
                    offerId,
                    cvFile,
                    coverLetterFile,
                    message,
                    username
            );

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Candidature envoyée avec succès");
            response.put("applicationId", application.getId());
            response.put("cvFileName", cvFile.getOriginalFilename());
            response.put("coverLetterFileName", coverLetterFile.getOriginalFilename());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Une erreur s'est produite lors du traitement des fichiers"));
        }
    }

    private void validateFile(MultipartFile file, String fileType, String[] allowedTypes) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException(fileType + " est vide");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException(fileType + " est trop volumineux (max 5MB)");
        }

        boolean isValidType = false;
        for (String allowedType : allowedTypes) {
            if (file.getContentType() != null && file.getContentType().equals(allowedType)) {
                isValidType = true;
                break;
            }
        }

        String filename = file.getOriginalFilename();
        if (filename != null) {
            String extension = filename.substring(filename.lastIndexOf(".")).toLowerCase();
            if (fileType.equals("CV") && !extension.equals(".pdf")) {
                isValidType = false;
            } else if (fileType.equals("Lettre de motivation") &&
                    !extension.equals(".pdf") && !extension.equals(".doc") && !extension.equals(".docx")) {
                isValidType = false;
            }
        }

        if (!isValidType) {
            throw new IllegalArgumentException("Format de " + fileType + " non supporté");
        }
    }

    @GetMapping
    public ResponseEntity<?> getMyApplications(Authentication authentication) {
        try {
            String username = authentication.getName();
            List<Application> applications = applicationService.getApplicationsByCandidate(username);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/with-offers")
    public ResponseEntity<?> getMyApplicationsWithOffers(Authentication authentication) {
        try {
            String username = authentication.getName();
            List<Application> applications = applicationService.getApplicationsByCandidate(username);


            List<Map<String, Object>> response = applications.stream().map(app -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", app.getId());
                map.put("status", app.getStatus());
                map.put("applicationDate", app.getCreatedAt());
                map.put("message", app.getMessage());
                map.put("statusDate", app.getCreatedAt());


                if (app.getOffer() != null) {
                    Map<String, Object> offerMap = new HashMap<>();
                    offerMap.put("id", app.getOffer().getId());
                    offerMap.put("title", app.getOffer().getTitle());
                    offerMap.put("description", app.getOffer().getDescription());
                    offerMap.put("location", app.getOffer().getLocation());
                    offerMap.put("published", app.getOffer().isPublished());
                    offerMap.put("createDate", app.getOffer().getCreateDate());
                    map.put("offer", offerMap);
                }

                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{applicationId}/cv")
    public ResponseEntity<ByteArrayResource> downloadCv(@PathVariable Long applicationId, Authentication authentication) {
        try {
            String username = authentication.getName();
            Application application = applicationService.getApplicationById(applicationId);


            if (!application.getCandidate().getUsername().equals(username)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            byte[] fileContent = applicationService.downloadCv(applicationId);
            String fileName = extractFileName(application.getCvPath());

            ByteArrayResource resource = new ByteArrayResource(fileContent);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + fileName + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/{applicationId}/cover-letter")
    public ResponseEntity<ByteArrayResource> downloadCoverLetter(@PathVariable Long applicationId, Authentication authentication) {
        try {
            String username = authentication.getName();
            Application application = applicationService.getApplicationById(applicationId);


            if (!application.getCandidate().getUsername().equals(username)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            byte[] fileContent = applicationService.downloadCoverLetter(applicationId);
            String fileName = extractFileName(application.getCoverLetterPath());

            ByteArrayResource resource = new ByteArrayResource(fileContent);


            MediaType mediaType = determineMediaType(application.getCoverLetterPath());

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + fileName + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    private String extractFileName(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return "document";
        }


        int lastSlash = filePath.lastIndexOf('/');
        int lastBackslash = filePath.lastIndexOf('\\');
        int lastSeparator = Math.max(lastSlash, lastBackslash);

        if (lastSeparator != -1) {
            return filePath.substring(lastSeparator + 1);
        }
        return filePath;
    }

    private MediaType determineMediaType(String filePath) {
        if (filePath == null) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }

        String lowerPath = filePath.toLowerCase();
        if (lowerPath.endsWith(".pdf")) {
            return MediaType.APPLICATION_PDF;
        } else if (lowerPath.endsWith(".doc")) {
            return new MediaType("application", "msword");
        } else if (lowerPath.endsWith(".docx")) {
            return new MediaType("application",
                    "vnd.openxmlformats-officedocument.wordprocessingml.document");
        } else {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    @GetMapping("/with-scores")
    public ResponseEntity<?> getMyApplicationsWithScores(Authentication authentication) {
        try {
            String username = authentication.getName();
            List<CandidateApplicationWithScoreDto> applications =
                    applicationService.getApplicationsByCandidateWithSimilarity(username);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkIfAlreadyApplied(
            @RequestParam("offerId") Long offerId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            boolean alreadyApplied = applicationService.hasCandidateAppliedToOffer(username, offerId);
            return ResponseEntity.ok(alreadyApplied);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{applicationId}")
    public ResponseEntity<?> deleteApplication(
            @PathVariable Long applicationId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            applicationService.deleteApplication(applicationId, username);
            return ResponseEntity.ok(Map.of("message", "Candidature supprimée avec succès"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la suppression : " + e.getMessage()));
        }
    }

    @GetMapping("/cv-history")
    public ResponseEntity<?> getMyCvHistory(Authentication authentication) {
        try {
            String username = authentication.getName();
            List<Application> applications = applicationService.getApplicationsByCandidate(username);

            List<Map<String, Object>> history = applications.stream()
                    .filter(app -> app.getCvPath() != null)
                    .map(app -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("applicationId", app.getId());
                        map.put("cvFileName", extractFileName(app.getCvPath()));
                        map.put("offerTitle", app.getOffer() != null ? app.getOffer().getTitle() : "");
                        map.put("applicationDate", app.getCreatedAt());
                        return map;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

}