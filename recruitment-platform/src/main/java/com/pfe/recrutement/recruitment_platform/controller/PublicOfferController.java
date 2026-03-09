package com.pfe.recrutement.recruitment_platform.controller;

import com.pfe.recrutement.recruitment_platform.model.Offer;
import com.pfe.recrutement.recruitment_platform.security.services.OfferService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/offers")
@CrossOrigin(origins = "http://localhost:4200")
public class PublicOfferController {

    private final OfferService offerService;

    public PublicOfferController(OfferService offerService) {
        this.offerService = offerService;
    }


    @GetMapping
    public ResponseEntity<List<Offer>> getPublishedOffers() {
        return ResponseEntity.ok(offerService.getPublishedOffers());
    }


    @GetMapping("/{id}")
    public ResponseEntity<Offer> getOfferById(@PathVariable Long id) {
        return ResponseEntity.ok(offerService.getOfferById(id));
    }
}