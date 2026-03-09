package com.pfe.recrutement.recruitment_platform.repositories;

import com.pfe.recrutement.recruitment_platform.model.PasswordResetToken;
import com.pfe.recrutement.recruitment_platform.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    Optional<PasswordResetToken> findByUser(User user);
}