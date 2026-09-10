package com.infosys.vault.repository;

import com.infosys.vault.model.LoginLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoginLogRepository extends JpaRepository<LoginLog, Long> {
    List<LoginLog> findByUsernameIgnoreCaseOrderByTimestampDesc(String username);
    List<LoginLog> findAllByOrderByTimestampDesc();
}
