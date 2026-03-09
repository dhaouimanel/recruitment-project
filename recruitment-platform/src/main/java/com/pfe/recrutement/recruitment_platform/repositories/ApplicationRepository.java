package com.pfe.recrutement.recruitment_platform.repositories;

import com.pfe.recrutement.recruitment_platform.model.Application;
import com.pfe.recrutement.recruitment_platform.model.Offer;
import com.pfe.recrutement.recruitment_platform.model.ApplicationStatus;

import com.pfe.recrutement.recruitment_platform.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {


    boolean existsByOfferAndCandidate(Offer offer, User candidate);

    @Query("SELECT a FROM Application a JOIN FETCH a.offer WHERE a.candidate.id = :candidateId")
    List<Application> findByCandidateIdWithOffer(@Param("candidateId") Long candidateId);

    @Query("SELECT a FROM Application a JOIN FETCH a.candidate JOIN FETCH a.offer")
    List<Application> findAllWithCandidateAndOffer();

    @Query("SELECT a FROM Application a JOIN FETCH a.candidate WHERE a.offer = :offer")
    List<Application> findByOfferWithCandidate(@Param("offer") Offer offer);

    long countByStatus(ApplicationStatus status);

    @Query("SELECT a FROM Application a JOIN FETCH a.offer o JOIN FETCH a.candidate c WHERE c.username = :username")
    List<Application> findByCandidateWithOffer(@Param("username") String username);


}