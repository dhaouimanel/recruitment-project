/*package com.pfe.recrutement.recruitment_platform.security.services;

import org.springframework.ai.embedding.EmbeddingClient;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmbeddingService {

    private final EmbeddingClient embeddingClient;

    public EmbeddingService(EmbeddingClient embeddingClient) {
        this.embeddingClient = embeddingClient;
    }

    /**
     * Génère un vecteur d'embedding pour le texte donné.
     */
    /*public List<Double> generateEmbedding(String text) {
        EmbeddingResponse response = embeddingClient.embedForResponse(List.of(text));
        // response.getResult() renvoie le premier (et unique) résultat
        return response.getResult().getOutput();
    }

    /**
     * Calcule la similarité cosinus entre deux vecteurs.
     */
    /*public double cosineSimilarity(float[] vectorA, float[] vectorB) {
        if (vectorA == null || vectorB == null || vectorA.length != vectorB.length) {
            return 0.0;
        }
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += vectorA[i] * vectorA[i];
            normB += vectorB[i] * vectorB[i];
        }
        if (normA == 0 || normB == 0) return 0.0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}*/