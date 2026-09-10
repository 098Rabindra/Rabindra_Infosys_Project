package com.infosys.vault.repository;

import com.infosys.vault.model.SecurityAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityAlertRepository extends JpaRepository<SecurityAlert, Long> {
    List<SecurityAlert> findByEmailIgnoreCaseOrEmailIgnoreCaseOrderByCreatedAtDesc(String email, String username);
    List<SecurityAlert> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<SecurityAlert> findAllByOrderByCreatedAtDesc();
}
