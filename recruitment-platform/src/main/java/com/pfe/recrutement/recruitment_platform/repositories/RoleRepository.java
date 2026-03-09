package com.pfe.recrutement.recruitment_platform.repositories;

import com.pfe.recrutement.recruitment_platform.model.ERole;
import com.pfe.recrutement.recruitment_platform.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(ERole name);
}

