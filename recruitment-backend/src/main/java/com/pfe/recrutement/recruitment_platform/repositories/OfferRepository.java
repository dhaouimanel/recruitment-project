package com.pfe.recrutement.recruitment_platform.repositories;

import com.pfe.recrutement.recruitment_platform.model.Offer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OfferRepository extends JpaRepository<Offer, Long> {
    List<Offer> findByPublished(boolean published);

    List<Offer> findByLocationIgnoreCaseContaining(String location);
    List<Offer> findByPublishedAndLocationIgnoreCaseContaining(boolean published, String location);
}