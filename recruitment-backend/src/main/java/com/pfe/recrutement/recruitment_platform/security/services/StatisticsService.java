package com.pfe.recrutement.recruitment_platform.security.services;

import com.pfe.recrutement.recruitment_platform.dto.RhStatisticsDto;
import com.pfe.recrutement.recruitment_platform.model.Application;
import com.pfe.recrutement.recruitment_platform.model.ApplicationStatus;
import com.pfe.recrutement.recruitment_platform.model.Offer;
import com.pfe.recrutement.recruitment_platform.repositories.ApplicationRepository;
import com.pfe.recrutement.recruitment_platform.repositories.OfferRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class StatisticsService {
    @Autowired
    private OfferRepository offerRepository;
    @Autowired
    private ApplicationRepository applicationRepository;
    public RhStatisticsDto getRhStatistics() {
        RhStatisticsDto dto = new RhStatisticsDto();

        List<Offer> allOffers = offerRepository.findAll();
        long totalOffers = allOffers.size();
        long publishedOffers = allOffers.stream().filter(Offer::isPublished).count();
        dto.setTotalOffers(totalOffers);
        dto.setPublishedOffers(publishedOffers);

        List<Application> allApplications = applicationRepository.findAll();
        long totalApplications = allApplications.size();
        dto.setTotalApplications(totalApplications);

        double avg = totalOffers > 0 ? (double) totalApplications / totalOffers : 0;
        dto.setAveragePerOffer(Math.round(avg * 10.0) / 10.0);

        long recruteCount = countByStatus(allApplications, ApplicationStatus.RECRUTE);
        double conversionRate = totalApplications > 0 ? (recruteCount * 100.0) / totalApplications : 0;
        dto.setConversionRate(Math.round(conversionRate * 10.0) / 10.0);

        Map<String, Long> statusMap = new LinkedHashMap<>();
        statusMap.put("A_CONTACTER", countByStatus(allApplications, ApplicationStatus.A_CONTACTER));
        statusMap.put("RETENUE", countByStatus(allApplications, ApplicationStatus.RETENUE));
        statusMap.put("ELIMINE", countByStatus(allApplications, ApplicationStatus.ELIMINE));
        statusMap.put("RECRUTE", recruteCount);
        dto.setApplicationsByStatus(statusMap);

        dto.setApplicationsOverTime(getMonthlyApplications(allApplications));

        dto.setTopLocations(getTopLocations(allOffers));

        return dto;
    }
    private long countByStatus(List<Application> applications, ApplicationStatus status) {
        return applications.stream().filter(a -> a.getStatus() == status).count();
    }
    private List<RhStatisticsDto.MonthlyCount> getMonthlyApplications(List<Application> applications) {
        Map<String, Long> raw = applications.stream()
                .map(Application::getCreatedAt)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(
                        date -> date.format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.counting()
                ));

        List<Map.Entry<String, Long>> sorted = raw.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .collect(Collectors.toList());

        List<RhStatisticsDto.MonthlyCount> result = new ArrayList<>();
        for (Map.Entry<String, Long> entry : sorted) {
            int month = Integer.parseInt(entry.getKey().substring(5));
            String monthName = getMonthShortName(month);
            result.add(new RhStatisticsDto.MonthlyCount(monthName, entry.getValue()));
        }
        return result;
    }

    private String getMonthShortName(int month) {
        String[] months = {"Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
                "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"};
        return months[month - 1];
    }
    private List<RhStatisticsDto.LocationCount> getTopLocations(List<Offer> offers) {
        Map<String, Long> locationCounts = offers.stream()
                .filter(o -> o.getLocation() != null && !o.getLocation().isEmpty())
                .collect(Collectors.groupingBy(
                        Offer::getLocation,
                        Collectors.counting()
                ));

        return locationCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> new RhStatisticsDto.LocationCount(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }
}