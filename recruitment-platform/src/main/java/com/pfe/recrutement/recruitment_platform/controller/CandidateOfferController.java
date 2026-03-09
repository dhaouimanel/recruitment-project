package com.pfe.recrutement.recruitment_platform.controller;

import com.pfe.recrutement.recruitment_platform.model.Offer;
import com.pfe.recrutement.recruitment_platform.security.services.OfferService;
import com.pfe.recrutement.recruitment_platform.security.services.OllamaEmbeddingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/candidate/offers")
@PreAuthorize("hasRole('CANDIDAT')")
public class CandidateOfferController {

    @Autowired
    private OfferService offerService;

    @Autowired
    private OllamaEmbeddingService embeddingService;

    @GetMapping("/search")
    public ResponseEntity<List<Offer>> searchOffers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String location) {

        List<Offer> offers;

        if (location != null && !location.trim().isEmpty()) {
            offers = offerService.getOffersByLocation(location);
        } else {
            offers = offerService.getPublishedOffers();
        }

        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(offers);
        }

        String searchTerm = query.trim().toLowerCase();


        offers = offers.stream()
                .filter(o -> o.getTitle().toLowerCase().contains(searchTerm))
                .limit(50)
                .collect(Collectors.toList());


        float[] queryEmbedding = embeddingService.generateEmbeddingCached(query);

        offers.sort((o1, o2) -> {
            float[] emb1 = o1.getEmbeddingAsFloatArray();
            float[] emb2 = o2.getEmbeddingAsFloatArray();

            double sim1 = emb1 != null ? embeddingService.cosineSimilarity(queryEmbedding, emb1) : 0;
            double sim2 = emb2 != null ? embeddingService.cosineSimilarity(queryEmbedding, emb2) : 0;

            return Double.compare(sim2, sim1);
        });

        return ResponseEntity.ok(offers);
    }


}