package com.pfe.recrutement.recruitment_platform.security.services;

import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class TextExtractionService {
    private final Tika tika = new Tika();

    public String extractText(MultipartFile file) throws IOException {
        try {
            return tika.parseToString(file.getInputStream());
        } catch (TikaException e) {
            throw new IOException("Erreur lors de l'extraction du texte avec Tika", e);
        }
    }
}