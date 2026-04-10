package com.pfe.recrutement.recruitment_platform.security.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    private void ensureDirectoryExists(Path directory) throws IOException {
        if (!Files.exists(directory)) {
            Files.createDirectories(directory);
        }
    }
    public String storeFile(MultipartFile file, String directory) throws IOException {
        Path uploadPath = Paths.get(uploadDir, directory);
        ensureDirectoryExists(uploadPath);

        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
        Path filePath = uploadPath.resolve(uniqueFileName);

        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return directory + "/" + uniqueFileName;
    }

    public byte[] loadFile(String filePath) throws IOException {

        Path path;
        if (filePath.startsWith(uploadDir)) {
            path = Paths.get(filePath);
        } else {
            path = Paths.get(uploadDir, filePath);
        }

        if (!Files.exists(path)) {
            throw new IOException("Fichier non trouvé: " + path.toString());
        }

        return Files.readAllBytes(path);
    }
    public void deleteFile(String filePath) throws IOException {
        Path path = Paths.get(uploadDir, filePath);
        Files.deleteIfExists(path);
    }
    public boolean isValidFileType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null) {
            return false;
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            String extension = originalFilename.toLowerCase();
            return extension.endsWith(".pdf") ||
                    extension.endsWith(".doc") ||
                    extension.endsWith(".docx");
        }

        return contentType.equals("application/pdf") ||
                contentType.equals("application/msword") ||
                contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    }

    public Path getFullPath(String relativePath) {
        return Paths.get(uploadDir, relativePath);
    }
}