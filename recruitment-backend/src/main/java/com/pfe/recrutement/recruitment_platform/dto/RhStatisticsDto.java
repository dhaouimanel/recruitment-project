package com.pfe.recrutement.recruitment_platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RhStatisticsDto {

    private long totalOffers;

    private long publishedOffers;

    private long totalApplications;

    private double averagePerOffer;

    private double conversionRate;

    private Map<String, Long> applicationsByStatus;

    private List<MonthlyCount> applicationsOverTime;

    private List<LocationCount> topLocations;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MonthlyCount {
        private String month;
        private long count;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LocationCount {
        private String location;
        private long count;
    }
}