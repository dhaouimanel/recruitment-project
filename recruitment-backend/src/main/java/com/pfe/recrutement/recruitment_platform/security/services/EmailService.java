package com.pfe.recrutement.recruitment_platform.security.services;

import com.pfe.recrutement.recruitment_platform.dto.ApplicationEmailDTO;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;
    @Value("${recruitment.email.sender}")
    private String senderEmail;
    @Value("${recruitment.email.sender.name}")
    private String senderName;

    public void sendApplicationEmail(ApplicationEmailDTO emailDTO) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message,
                    true,
                    StandardCharsets.UTF_8.name());

            helper.setTo(emailDTO.getCandidateEmail());
            helper.setFrom(new InternetAddress(senderEmail, senderName, StandardCharsets.UTF_8.name()));


            String subject;
            String htmlContent;

            switch(emailDTO.getEmailType()) {
                case "interview":
                    subject = "Invitation à un entretien - " + emailDTO.getOfferTitle();
                    htmlContent = generateInterviewEmail(emailDTO);
                    break;
                case "rejection":
                    subject = "Retour sur votre candidature - " + emailDTO.getOfferTitle();
                    htmlContent = generateRejectionEmail(emailDTO);
                    break;
                default:
                    subject = "Message concernant votre candidature";
                    htmlContent = generateGenericEmail(emailDTO);
            }

            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("✅ Email envoyé avec succès à : " + emailDTO.getCandidateEmail());

        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'envoi de l'email : " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de l'envoi de l'email", e);
        }
    }
    private String generateInterviewEmail(ApplicationEmailDTO emailDTO) {
        System.out.println("📧 generateInterviewEmail - customData : " + emailDTO.getCustomData());

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Invitation Entretien</title>");
        html.append("<style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;}</style>");
        html.append("</head><body>");
        html.append("<h2>Bonjour ").append(emailDTO.getCandidateName()).append(",</h2>");
        html.append("<p>Nous vous remercions pour votre candidature au poste de <strong>").append(emailDTO.getOfferTitle()).append("</strong>.</p>");
        html.append("<p>Nous sommes intéressés par votre profil et souhaitons vous inviter à un entretien :</p>");

        if (emailDTO.getCustomData() != null) {
            html.append("<div style='background-color:#f5f5f5;padding:15px;border-radius:5px;margin:20px 0;'>");

            String date = emailDTO.getCustomData().get("interviewDate");
            if (date != null && !date.trim().isEmpty()) {
                html.append("<p><strong>Date :</strong> ").append(date).append("</p>");
            }

            String time = emailDTO.getCustomData().get("interviewTime");
            if (time != null && !time.trim().isEmpty()) {
                html.append("<p><strong>Heure :</strong> ").append(time).append("</p>");
            }

            String location = emailDTO.getCustomData().get("interviewLocation");
            if (location != null && !location.trim().isEmpty()) {
                html.append("<p><strong>Lieu :</strong> ").append(location).append("</p>");
            }

            html.append("</div>");
        }

        html.append("<p>Merci de confirmer votre participation en répondant à cet email.</p>");
        html.append("<p>Cordialement,<br><strong>L'équipe RH</strong><br>Plateforme de Recrutement</p>");
        html.append("</body></html>");

        return html.toString();
    }
    private String generateRejectionEmail(ApplicationEmailDTO emailDTO) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Retour Candidature</title>");
        html.append("<style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;}</style>");
        html.append("</head><body>");
        html.append("<h2>Bonjour ").append(emailDTO.getCandidateName()).append(",</h2>");
        html.append("<p>Nous vous remercions pour votre candidature au poste de <strong>").append(emailDTO.getOfferTitle()).append("</strong>.</p>");
        html.append("<p>Après examen attentif de votre profil, nous regrettons de vous informer que nous ne pourrons pas donner suite à votre candidature pour ce poste.</p>");

        if (emailDTO.getCustomData() != null && emailDTO.getCustomData().containsKey("rejectionReason")) {
            html.append("<p><strong>Raison :</strong> ").append(emailDTO.getCustomData().get("rejectionReason")).append("</p>");
        }

        html.append("<p>Nous conservons votre CV dans notre base de données et ne manquerons pas de vous recontacter si un poste correspondant à votre profil se présente.</p>");
        html.append("<p>Cordialement,<br><strong>L'équipe RH</strong><br>Plateforme de Recrutement</p>");
        html.append("</body></html>");

        return html.toString();
    }

    private String generateGenericEmail(ApplicationEmailDTO emailDTO) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Message Candidature</title>");
        html.append("<style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;}</style>");
        html.append("</head><body>");
        html.append("<h2>Bonjour ").append(emailDTO.getCandidateName()).append(",</h2>");
        html.append("<p>Concernant votre candidature au poste de <strong>").append(emailDTO.getOfferTitle()).append("</strong>.</p>");

        if (emailDTO.getCustomData() != null && emailDTO.getCustomData().containsKey("message")) {
            html.append("<p>").append(emailDTO.getCustomData().get("message")).append("</p>");
        }

        html.append("<p>Nous restons à votre disposition pour toute information complémentaire.</p>");
        html.append("<p>Cordialement,<br><strong>L'équipe RH</strong><br>Plateforme de Recrutement</p>");
        html.append("</body></html>");

        return html.toString();
    }
}