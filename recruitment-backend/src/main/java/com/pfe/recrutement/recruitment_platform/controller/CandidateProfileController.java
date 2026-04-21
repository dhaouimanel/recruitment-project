package com.pfe.recrutement.recruitment_platform.controller;

import com.pfe.recrutement.recruitment_platform.security.services.CandidateProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/candidate/profile")
@CrossOrigin(origins = "http://localhost:4200")
@PreAuthorize("hasRole('CANDIDAT')")
public class CandidateProfileController {

    @Autowired
    private CandidateProfileService candidateProfileService;

    @GetMapping("/cv-info")
    public ResponseEntity<?> getCvInfo(Authentication authentication) {
        try {
            String username = authentication.getName();
            // Récupérer les infos depuis le service (à implémenter)
            Map<String, Object> info = candidateProfileService.getCvInfo(username);
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", "CV non trouvé"));
        }
    }

    @GetMapping("/cv")
    public ResponseEntity<ByteArrayResource> getCv(Authentication authentication) throws IOException {
        String username = authentication.getName();
        byte[] cvData = candidateProfileService.getCurrentUserCv(username);
        if (cvData == null) {
            return ResponseEntity.notFound().build();
        }
        ByteArrayResource resource = new ByteArrayResource(cvData);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"mon_cv.pdf\"")
                .body(resource);
    }

    @PostMapping("/cv")
    public ResponseEntity<?> uploadCv(@RequestParam("cv") MultipartFile cvFile,
                                      Authentication authentication) throws IOException {
        String username = authentication.getName();
        candidateProfileService.updateCurrentUserCv(username, cvFile);
        return ResponseEntity.ok(Map.of("message", "CV mis à jour avec succès"));
    }

    @DeleteMapping("/cv")
    public ResponseEntity<?> deleteCv(Authentication authentication) throws IOException {
        String username = authentication.getName();
        candidateProfileService.deleteCurrentUserCv(username);
        return ResponseEntity.ok(Map.of("message", "CV supprimé avec succès"));
    }
}