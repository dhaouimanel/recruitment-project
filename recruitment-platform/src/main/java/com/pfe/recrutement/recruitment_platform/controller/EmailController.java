package com.pfe.recrutement.recruitment_platform.controller;

import com.pfe.recrutement.recruitment_platform.dto.ApplicationEmailDTO;
import com.pfe.recrutement.recruitment_platform.security.services.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emails")
@CrossOrigin(origins = "*")
public class EmailController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/send-to-candidate")
    public ResponseEntity<String> sendEmailToCandidate(@RequestBody ApplicationEmailDTO emailDTO) {
        try {
            emailService.sendApplicationEmail(emailDTO);
            return ResponseEntity.ok("Email envoyé avec succès");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l'envoi: " + e.getMessage());
        }
    }

    @PostMapping("/send-bulk")
    public ResponseEntity<String> sendBulkEmails(@RequestBody List<ApplicationEmailDTO> emails) {
        for (ApplicationEmailDTO email : emails) {
            emailService.sendApplicationEmail(email);
        }
        return ResponseEntity.ok("Emails envoyés avec succès");
    }
}