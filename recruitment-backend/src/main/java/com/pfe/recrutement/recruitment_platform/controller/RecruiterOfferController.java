package com.pfe.recrutement.recruitment_platform.controller;

import com.pfe.recrutement.recruitment_platform.security.services.OfferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recruiter/offers")
@PreAuthorize("hasRole('RH')")
public class RecruiterOfferController {

    @Autowired
    private OfferService offerService;

    @PostMapping("/generate-embeddings")
    public ResponseEntity<String> generateEmbeddings() {
        offerService.generateEmbeddingsForAllOffers();
        return ResponseEntity.ok("Génération des embeddings lancée avec succès.");
    }
}