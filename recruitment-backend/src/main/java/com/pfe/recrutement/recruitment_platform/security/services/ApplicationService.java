package com.pfe.recrutement.recruitment_platform.security.services;

import com.pfe.recrutement.recruitment_platform.dto.ApplicationDto;
import com.pfe.recrutement.recruitment_platform.dto.RhApplicationResponseDto;
import com.pfe.recrutement.recruitment_platform.model.ApplicationStatus;
import com.pfe.recrutement.recruitment_platform.dto.CandidateApplicationWithScoreDto;
import com.pfe.recrutement.recruitment_platform.model.Application;
import com.pfe.recrutement.recruitment_platform.model.Offer;
import com.pfe.recrutement.recruitment_platform.model.User;
import com.pfe.recrutement.recruitment_platform.repositories.ApplicationRepository;
import com.pfe.recrutement.recruitment_platform.repositories.OfferRepository;
import com.pfe.recrutement.recruitment_platform.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;
    @Autowired
    private OfferRepository offerRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private FileStorageService fileStorageService;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Autowired
    private PdfTextExtractor pdfTextExtractor;

    @Autowired
    private OllamaEmbeddingService embeddingService;


    @Transactional
    public Application createApplication(ApplicationDto dto, String username) {

        Offer offer = offerRepository.findById(dto.getOfferId())
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));
        User candidate = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (applicationRepository.existsByOfferAndCandidate(offer, candidate)) {
            throw new RuntimeException("Vous avez déjà postulé à cette offre");
        }
        Application application = new Application();
        application.setOffer(offer);
        application.setCandidate(candidate);
        application.setCvPath(dto.getCvPath());
        application.setCoverLetterPath(dto.getCoverLetterPath());
        application.setMessage(dto.getMessage());

        return applicationRepository.save(application);
    }
    @Transactional
    public Application createApplicationWithFiles(ApplicationDto dto, String username) throws IOException {

        if (dto.getCvPath() == null || dto.getCvPath().isEmpty()) {
            throw new RuntimeException("Le CV est obligatoire");
        }
        if (dto.getCoverLetterPath() == null || dto.getCoverLetterPath().isEmpty()) {
            throw new RuntimeException("La lettre de motivation est obligatoire");
        }

        return createApplication(dto, username);
    }
    public List<Application> getApplicationsByCandidate(String username) {

        if (!userRepository.existsByUsername(username)) {
            throw new RuntimeException("Utilisateur non trouvé");
        }
        List<Application> applications = applicationRepository.findByCandidateWithOffer(username);
        for (Application app : applications) {
            if (app.getOffer() != null) {
                System.out.println("✅ Offre chargée pour application " + app.getId() +
                        ": " + app.getOffer().getTitle());
            } else {
                System.out.println("❌ Offre NULL pour application " + app.getId());
            }
        }

        return applications;
    }
    public Application getApplicationById(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidature non trouvée"));
    }
    @Transactional
    public Application updateApplicationStatus(Long id, ApplicationStatus status) {
        Application application = getApplicationById(id);

        application.setStatus(status);
        application.setUpdatedAt(LocalDateTime.now());

        return applicationRepository.save(application);
    }

    public List<Application> getAllApplicationsForRh() {
        return applicationRepository.findAllWithCandidateAndOffer();
    }
    public List<Application> getApplicationsByOfferId(Long offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));
        return applicationRepository.findByOfferWithCandidate(offer);
    }
    public byte[] downloadCv(Long applicationId) throws IOException {
        Application application = getApplicationById(applicationId);
        if (application.getCvPath() == null) {
            throw new RuntimeException("CV non trouvé pour cette candidature");
        }
        return fileStorageService.loadFile(application.getCvPath());
    }

    public byte[] downloadCoverLetter(Long applicationId) throws IOException {
        Application application = getApplicationById(applicationId);
        if (application.getCoverLetterPath() == null) {
            throw new RuntimeException("Lettre de motivation non trouvée pour cette candidature");
        }
        return fileStorageService.loadFile(application.getCoverLetterPath());
    }
    public Map<String, Object> getApplicationsStatistics() {
        Map<String, Object> stats = new HashMap<>();

        long total = applicationRepository.count();

        long aContacter = applicationRepository.countByStatus(ApplicationStatus.A_CONTACTER);
        long retenue = applicationRepository.countByStatus(ApplicationStatus.RETENUE);
        long elimine = applicationRepository.countByStatus(ApplicationStatus.ELIMINE);
        long recrute = applicationRepository.countByStatus(ApplicationStatus.RECRUTE);

        stats.put("total", total);
        stats.put("aContacter", aContacter);
        stats.put("retenue", retenue);
        stats.put("elimine", elimine);
        stats.put("recrute", recrute);

        if (total > 0) {
            stats.put("pourcentageContacter", (aContacter * 100.0) / total);
            stats.put("pourcentageRetenue", (retenue * 100.0) / total);
            stats.put("pourcentageElimine", (elimine * 100.0) / total);
            stats.put("pourcentageRecrute", (recrute * 100.0) / total);
        }

        return stats;
    }

    @Transactional
    public Application createApplicationWithMultipartFiles(Long offerId,
                                                           String cvFileName,
                                                           String coverLetterFileName,
                                                           String message,
                                                           String username) {

        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));

        User candidate = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (applicationRepository.existsByOfferAndCandidate(offer, candidate)) {
            throw new RuntimeException("Vous avez déjà postulé à cette offre");
        }

        Application application = new Application();
        application.setOffer(offer);
        application.setCandidate(candidate);
        application.setCvPath(cvFileName);
        application.setCoverLetterPath(coverLetterFileName);
        application.setMessage(message);

        return applicationRepository.save(application);
    }

    public RhApplicationResponseDto mapToDto(Application app) {
        return new RhApplicationResponseDto(
                app.getId(),
                app.getOffer().getId(),
                app.getOffer().getTitle(),
                app.getCandidate().getId(),
                app.getCandidate().getFname(),
                app.getCandidate().getLname(),
                app.getCandidate().getEmail(),
                app.getCandidate().getPhone(),
                app.getCvPath(),
                app.getCoverLetterPath(),
                app.getMessage(),
                app.getStatus(),
                app.getCreatedAt(),
                app.getUpdatedAt(),
                null
        );
    }

    private Set<String> tokenize(String text) {
        if (text == null) return new HashSet<>();
        return Arrays.stream(text.toLowerCase().split("\\W+"))
                .filter(word -> word.length() > 2)
                .collect(Collectors.toSet());
    }

    private double jaccardSimilarity(String text1, String text2) {
        Set<String> set1 = tokenize(text1);
        Set<String> set2 = tokenize(text2);
        if (set1.isEmpty() && set2.isEmpty()) return 1.0;
        if (set1.isEmpty() || set2.isEmpty()) return 0.0;

        Set<String> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);
        Set<String> union = new HashSet<>(set1);
        union.addAll(set2);

        return (double) intersection.size() / union.size();
    }

    @Transactional(readOnly = true)
    public List<RhApplicationResponseDto> getApplicationsByOfferWithSimilarity(Long offerId) {

        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));

        float[] offerEmbedding = offer.getEmbeddingAsFloatArray();
        if (offerEmbedding == null) {
            throw new RuntimeException("Embedding offre manquant");
        }

        List<Application> applications = applicationRepository.findByOfferWithCandidate(offer);
        List<RhApplicationResponseDto> dtos = new ArrayList<>();

        for (Application app : applications) {
            RhApplicationResponseDto dto = mapToDto(app);
            double score = 0.0;

            float[] cvEmbedding = app.getCvEmbeddingAsFloatArray();
            if (cvEmbedding != null) {
                score = embeddingService.cosineSimilarity(offerEmbedding, cvEmbedding);
            }

            dto.setSimilarityScore(score);
            dtos.add(dto);
        }

        dtos.sort((a, b) -> Double.compare(b.getSimilarityScore(), a.getSimilarityScore()));
        return dtos;
    }

    @Transactional(readOnly = true)
    public List<CandidateApplicationWithScoreDto> getApplicationsByCandidateWithSimilarity(String username) {

        List<Application> applications = getApplicationsByCandidate(username);
        List<CandidateApplicationWithScoreDto> result = new ArrayList<>();

        for (Application app : applications) {
            CandidateApplicationWithScoreDto dto = new CandidateApplicationWithScoreDto();
            dto.setId(app.getId());
            dto.setStatus(app.getStatus());
            dto.setApplicationDate(app.getCreatedAt());
            dto.setMessage(app.getMessage());

            if (app.getOffer() != null) {
                Map<String, Object> offerMap = new HashMap<>();
                offerMap.put("id", app.getOffer().getId());
                offerMap.put("title", app.getOffer().getTitle());
                offerMap.put("description", app.getOffer().getDescription());
                offerMap.put("location", app.getOffer().getLocation());
                offerMap.put("published", app.getOffer().isPublished());
                offerMap.put("createDate", app.getOffer().getCreateDate());
                dto.setOffer(offerMap);

                double score = 0.0;

                float[] cvEmbedding = app.getCvEmbeddingAsFloatArray();
                float[] offerEmbedding = app.getOffer().getEmbeddingAsFloatArray();

                if (cvEmbedding != null && offerEmbedding != null) {
                    score = embeddingService.cosineSimilarity(offerEmbedding, cvEmbedding);
                }

                dto.setSimilarityScore(score);
            }

            result.add(dto);
        }

        result.sort((a, b) -> Double.compare(
                b.getSimilarityScore() != null ? b.getSimilarityScore() : 0.0,
                a.getSimilarityScore() != null ? a.getSimilarityScore() : 0.0
        ));

        return result;
    }

    @Transactional
    public Application createApplicationWithFiles(
            Long offerId,
            MultipartFile cvFile,
            MultipartFile coverLetterFile,
            String message,
            String username) throws IOException {

        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));
        User candidate = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (applicationRepository.existsByOfferAndCandidate(offer, candidate)) {
            throw new RuntimeException("Vous avez déjà postulé à cette offre");
        }

        String cvPath = fileStorageService.storeFile(cvFile, "cvs");
        String coverLetterPath = coverLetterFile != null ? fileStorageService.storeFile(coverLetterFile, "coverLetters") : null;

        byte[] cvBytes = cvFile.getBytes();
        String cvText = pdfTextExtractor.extractText(cvBytes);
        float[] cvEmbedding = embeddingService.generateEmbedding(cvText);

        Application application = new Application();
        application.setOffer(offer);
        application.setCandidate(candidate);
        application.setCvPath(cvPath);
        application.setCoverLetterPath(coverLetterPath);
        application.setMessage(message);
        application.setStatus(ApplicationStatus.A_CONTACTER);
        application.setCvEmbeddingFromFloatArray(cvEmbedding);

        return applicationRepository.save(application);
    }

    public List<RhApplicationResponseDto> getApplicationsWithScoreAboveThreshold(Long offerId, double threshold) {

        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));
        float[] offerEmbedding = offer.getEmbeddingAsFloatArray();
        if (offerEmbedding == null) {
            throw new RuntimeException("L'offre n'a pas d'embedding. Veuillez d'abord générer les embeddings des offres.");
        }
        List<Application> applications = applicationRepository.findByOfferWithCandidate(offer);
        List<RhApplicationResponseDto> result = new ArrayList<>();

        for (Application app : applications) {
            float[] cvEmbedding = app.getCvEmbeddingAsFloatArray();
            if (cvEmbedding == null) continue;

            double score = embeddingService.cosineSimilarity(offerEmbedding, cvEmbedding);
            if (score > threshold) {
                RhApplicationResponseDto dto = mapToDto(app);
                dto.setSimilarityScore(score);
                result.add(dto);
            }
        }
        result.sort((a, b) -> Double.compare(b.getSimilarityScore(), a.getSimilarityScore()));
        return result;
    }

    @Transactional
    public void regenerateEmbeddingsForOffer(Long offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));
        List<Application> applications = applicationRepository.findByOfferWithCandidate(offer);
        for (Application app : applications) {
            if (app.getCvPath() != null) {
                try {
                    byte[] cvBytes = fileStorageService.loadFile(app.getCvPath());
                    String cvText = pdfTextExtractor.extractText(cvBytes);
                    float[] cvEmbedding = embeddingService.generateEmbedding(cvText);
                    app.setCvEmbeddingFromFloatArray(cvEmbedding);
                    applicationRepository.save(app);
                    System.out.println("✅ Embedding généré pour candidature " + app.getId());
                } catch (Exception e) {
                    System.err.println("❌ Erreur pour candidature " + app.getId() + " : " + e.getMessage());
                }
            }
        }
    }

    public boolean hasCandidateAppliedToOffer(String username, Long offerId) {
        User candidate = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));
        return applicationRepository.existsByOfferAndCandidate(offer, candidate);
    }

    @Transactional
    public void deleteApplication(Long applicationId, String username) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Candidature non trouvée"));

        if (!application.getCandidate().getUsername().equals(username)) {
            throw new RuntimeException("Vous n'êtes pas autorisé à supprimer cette candidature");
        }

        try {
            if (application.getCvPath() != null) {
                fileStorageService.deleteFile(application.getCvPath());
            }
            if (application.getCoverLetterPath() != null) {
                fileStorageService.deleteFile(application.getCoverLetterPath());
            }
        } catch (IOException e) {

            System.err.println("Erreur suppression fichiers : " + e.getMessage());
        }

        applicationRepository.delete(application);
    }
}