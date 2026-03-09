package com.pfe.recrutement.recruitment_platform.controller;

import com.pfe.recrutement.recruitment_platform.security.services.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
@PreAuthorize("hasRole('RH')")
public class TestController {

    @Autowired
    private ApplicationService applicationService;

    @PostMapping("/regenerate-embeddings/{offerId}")
    public ResponseEntity<String> regenerateEmbeddings(@PathVariable Long offerId) {
        applicationService.regenerateEmbeddingsForOffer(offerId);
        return ResponseEntity.ok("Régénération des embeddings terminée pour l'offre " + offerId);
    }
}
