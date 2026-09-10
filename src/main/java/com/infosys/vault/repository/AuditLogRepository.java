package com.infosys.vault.repository;

import com.infosys.vault.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEmailIgnoreCaseOrEmailIgnoreCaseOrderByTimestampDesc(String email, String username);
    List<AuditLog> findByUserIdOrderByTimestampDesc(Long userId);
    List<AuditLog> findAllByOrderByTimestampDesc();
}
