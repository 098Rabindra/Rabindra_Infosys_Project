package com.infosys.vault.repository;

import com.infosys.vault.model.SuspiciousActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuspiciousActivityRepository extends JpaRepository<SuspiciousActivity, Long> {
    List<SuspiciousActivity> findByEmailIgnoreCaseOrEmailIgnoreCaseOrderByDetectedAtDesc(String email, String username);
    List<SuspiciousActivity> findByUserIdOrderByDetectedAtDesc(Long userId);
    List<SuspiciousActivity> findAllByOrderByDetectedAtDesc();
}
