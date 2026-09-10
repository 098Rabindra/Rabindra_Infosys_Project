package com.infosys.vault.repository;

import com.infosys.vault.model.LoginSecurity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoginSecurityRepository extends JpaRepository<LoginSecurity, Long> {
    List<LoginSecurity> findByEmailIgnoreCaseOrderByTimestampDesc(String email);
    List<LoginSecurity> findByEmailIgnoreCaseOrEmailIgnoreCaseOrderByTimestampDesc(String email, String username);
    List<LoginSecurity> findAllByOrderByTimestampDesc();
}
