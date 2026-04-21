package com.pfe.recrutement.recruitment_platform.security.services;

import com.pfe.recrutement.recruitment_platform.model.User;
import com.pfe.recrutement.recruitment_platform.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class CandidateProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;


    public byte[] getCurrentUserCv(String username) throws IOException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        if (user.getCvPath() == null) {
            return null;
        }
        return fileStorageService.loadFile(user.getCvPath());
    }

    public void updateCurrentUserCv(String username, MultipartFile cvFile) throws IOException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        // Supprime l'ancien fichier si existant
        if (user.getCvPath() != null) {
            fileStorageService.deleteFile(user.getCvPath());
        }
        String newPath = fileStorageService.storeFile(cvFile, "cvs");
        user.setCvPath(newPath);
        user.setCvFilename(cvFile.getOriginalFilename());
        userRepository.save(user);
    }

    public void deleteCurrentUserCv(String username) throws IOException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        if (user.getCvPath() != null) {
            fileStorageService.deleteFile(user.getCvPath());
            user.setCvPath(null);
            user.setCvFilename(null);
            userRepository.save(user);
        }
    }

    public Map<String, Object> getCvInfo(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        Map<String, Object> info = new HashMap<>();
        if (user.getCvFilename() != null) {
            info.put("filename", user.getCvFilename());
            // Récupérer la taille du fichier depuis le stockage
            try {
                byte[] fileData = fileStorageService.loadFile(user.getCvPath());
                info.put("size", fileData.length);
            } catch (IOException e) {
                info.put("size", 0);
            }
        } else {
            info.put("filename", null);
            info.put("size", 0);
        }
        return info;
    }
}
