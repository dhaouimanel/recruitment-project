package com.pfe.recrutement.recruitment_platform.security.services;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class PdfTextExtractor {

    public String extractText(byte[] pdfContent) throws IOException {
        try (PDDocument document = PDDocument.load(pdfContent)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }
}