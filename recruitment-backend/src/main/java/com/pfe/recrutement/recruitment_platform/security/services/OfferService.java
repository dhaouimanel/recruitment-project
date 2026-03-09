package com.pfe.recrutement.recruitment_platform.security.services;

import com.pfe.recrutement.recruitment_platform.model.Offer;
import com.pfe.recrutement.recruitment_platform.repositories.OfferRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OfferService {

    @Autowired
    private OllamaEmbeddingService embeddingService;

    private final OfferRepository offerRepository;

    public OfferService(OfferRepository offerRepository) {
        this.offerRepository = offerRepository;
    }

    @Transactional
    public void initEmbeddings() {
        List<Offer> offers = offerRepository.findAll();
        for (Offer offer : offers) {
            if (offer.getEmbedding() == null) {
                String text = offer.getTitle() + " " + (offer.getLocation() != null ? offer.getLocation() : "");
                float[] embedding = embeddingService.generateEmbedding(text);
                offer.setEmbeddingFromFloatArray(embedding);
                offerRepository.save(offer);
            }
        }
    }
    public Offer createOffer(Offer offer) {
        String textToEmbed = offer.getTitle() + " " + (offer.getLocation() != null ? offer.getLocation() : "");
        float[] embedding = embeddingService.generateEmbedding(textToEmbed);
        offer.setEmbeddingFromFloatArray(embedding);
        return offerRepository.save(offer);
    }
    public List<Offer> getAllOffers() {
        return offerRepository.findAll();
    }
    public List<Offer> getPublishedOffers() {
        return offerRepository.findByPublished(true);
    }
    public Offer getOfferById(Long id) {
        return offerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));
    }
    public Offer updateOffer(Long id, Offer updatedOffer) {
        Offer offer = getOfferById(id);
        offer.setTitle(updatedOffer.getTitle());
        offer.setDescription(updatedOffer.getDescription());
        offer.setLocation(updatedOffer.getLocation());
        offer.setPublished(updatedOffer.isPublished());

        String textToEmbed = offer.getTitle() + " " + (offer.getLocation() != null ? offer.getLocation() : "");
        float[] embedding = embeddingService.generateEmbedding(textToEmbed);
        offer.setEmbeddingFromFloatArray(embedding);

        return offerRepository.save(offer);
    }
    public void deleteOffer(Long id) {
        offerRepository.deleteById(id);
    }
    @Transactional
    public void generateEmbeddingsForAllOffers() {
        List<Offer> offers = offerRepository.findAll();
        for (Offer offer : offers) {
            String text = offer.getTitle() + " " + (offer.getLocation() != null ? offer.getLocation() : "");
            float[] embedding = embeddingService.generateEmbedding(text);
            offer.setEmbeddingFromFloatArray(embedding);
            offerRepository.save(offer);
        }
    }
    public List<Offer> getOffersByLocation(String location) {
        return offerRepository.findByPublishedAndLocationIgnoreCaseContaining(true, location);
    }

}