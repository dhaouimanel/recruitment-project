package com.pfe.recrutement.recruitment_platform.controller;

import com.pfe.recrutement.recruitment_platform.dto.RhApplicationResponseDto;
import com.pfe.recrutement.recruitment_platform.model.Offer;
import com.pfe.recrutement.recruitment_platform.security.services.ApplicationService;
import com.pfe.recrutement.recruitment_platform.security.services.OfferService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/rh/offers")
@CrossOrigin(origins = "http://localhost:4200")
@PreAuthorize("hasRole('RH')")
public class RHOfferController {
    private final OfferService offerService;

    private final ApplicationService applicationService;

    public RHOfferController(OfferService offerService , ApplicationService applicationService) {
        this.offerService = offerService;
        this.applicationService = applicationService;
    }

    @GetMapping("/{offerId}/applications/scored")
    public ResponseEntity<List<RhApplicationResponseDto>> getScoredApplications(
            @PathVariable Long offerId,
            @RequestParam(defaultValue = "0.5") double threshold) {
        List<RhApplicationResponseDto> apps = applicationService.getApplicationsWithScoreAboveThreshold(offerId, threshold);
        return ResponseEntity.ok(apps);
    }

    @GetMapping
    public ResponseEntity<List<Offer>> getAllOffers() {
        System.out.println("📡 GET /api/rh/offers - Récupération des offres");
        List<Offer> offers = offerService.getAllOffers();
        System.out.println("📦 " + offers.size() + " offres trouvées");
        return ResponseEntity.ok(offers);
    }

    @PostMapping
    public ResponseEntity<Offer> createOffer(@RequestBody Offer offer) {
        System.out.println("📨 POST /api/rh/offers - Création d'une offre");
        System.out.println("📝 Données reçues: " + offer);
        Offer created = offerService.createOffer(offer);
        System.out.println("✅ Offre créée avec ID: " + created.getId());
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Offer> updateOffer(@PathVariable Long id, @RequestBody Offer offer) {
        System.out.println("✏️ PUT /api/rh/offers/" + id + " - Mise à jour");
        Offer updated = offerService.updateOffer(id, offer);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOffer(@PathVariable Long id) {
        System.out.println("🗑️ DELETE /api/eh/offers/" + id + " - Suppression");
        offerService.deleteOffer(id);
        return ResponseEntity.noContent().build();
    }
}
