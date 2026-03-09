package com.pfe.recrutement.recruitment_platform.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "offers")
public class Offer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String location;

    private boolean published = false;

    private LocalDateTime createDate;
    private LocalDateTime updatedAt;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "bytea")
    private byte[] embedding;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    @JsonIgnore
    private User admin;


    public Offer(String title, String description, String location, boolean published) {
        this.title = title;
        this.description = description;
        this.location = location;
        this.published = published;
    }

    @PrePersist
    public void onCreate() {
        createDate = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void setEmbeddingFromFloatArray(float[] floats) {
        if (floats == null) {
            this.embedding = null;
            return;
        }
        ByteBuffer buffer = ByteBuffer.allocate(floats.length * 4);
        buffer.asFloatBuffer().put(floats);
        this.embedding = buffer.array();
    }

    public byte[] getEmbedding() {
        return embedding;
    }

    public void setEmbedding(byte[] embedding) {
        this.embedding = embedding;
    }

    public float[] getEmbeddingAsFloatArray() {
        if (embedding == null) return null;
        float[] floats = new float[embedding.length / 4];
        ByteBuffer.wrap(embedding).asFloatBuffer().get(floats);
        return floats;
    }


}