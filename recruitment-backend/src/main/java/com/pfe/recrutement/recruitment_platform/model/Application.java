package com.pfe.recrutement.recruitment_platform.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.nio.ByteBuffer;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "applications")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "offer_id", nullable = false)
    private Offer offer;

    @ManyToOne
    @JoinColumn(name = "candidate_id", nullable = false)
    private User candidate;

    @Column(name = "cv_path")
    private String cvPath;

    @Column(name = "cover_letter_path")
    private String coverLetterPath;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.A_CONTACTER;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "bytea")
    private byte[] cvEmbedding;


    public byte[] getCvEmbedding() {
        return cvEmbedding;
    }

    public void setCvEmbedding(byte[] cvEmbedding) {
        this.cvEmbedding = cvEmbedding;
    }


    public void setCvEmbeddingFromFloatArray(float[] floats) {
        if (floats == null) {
            this.cvEmbedding = null;
            return;
        }
        ByteBuffer buffer = ByteBuffer.allocate(floats.length * 4);
        buffer.asFloatBuffer().put(floats);
        this.cvEmbedding = buffer.array();
    }

    public float[] getCvEmbeddingAsFloatArray() {
        if (cvEmbedding == null) return null;
        float[] floats = new float[cvEmbedding.length / 4];
        ByteBuffer.wrap(cvEmbedding).asFloatBuffer().get(floats);
        return floats;
    }


}