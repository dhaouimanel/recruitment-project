package com.pfe.recrutement.recruitment_platform.security.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OllamaEmbeddingService {


    private final Map<String, float[]> cache = new ConcurrentHashMap<>();

    private final RestClient restClient;

    @Value("${ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    @Value("${ollama.embedding.model:nomic-embed-text}")
    private String modelName;

    public OllamaEmbeddingService() {
        this.restClient = RestClient.create();
    }


    public float[] generateEmbeddingCached(String text) {
        return cache.computeIfAbsent(text, t -> generateEmbedding(t));
    }
    public float[] generateEmbedding(String text) {
        Map<String, Object> request = Map.of(
                "model", modelName,
                "prompt", text
        );

        Map response = restClient.post()
                .uri(ollamaUrl + "/api/embeddings")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(Map.class);

        List<Double> embeddingList = (List<Double>) response.get("embedding");
        float[] embedding = new float[embeddingList.size()];
        for (int i = 0; i < embeddingList.size(); i++) {
            embedding[i] = embeddingList.get(i).floatValue();
        }
        return embedding;
    }
    public double cosineSimilarity(float[] vectorA, float[] vectorB) {
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
}