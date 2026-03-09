package com.pfe.recrutement.recruitment_platform.controller;

import com.pfe.recrutement.recruitment_platform.dto.RhStatisticsDto;
import com.pfe.recrutement.recruitment_platform.security.services.StatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rh/statistics")
public class RhStatisticsController {

    @Autowired
    private StatisticsService statisticsService;

    @GetMapping
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN')")
    public ResponseEntity<RhStatisticsDto> getStatistics() {
        RhStatisticsDto stats = statisticsService.getRhStatistics();
        return ResponseEntity.ok(stats);
    }
}