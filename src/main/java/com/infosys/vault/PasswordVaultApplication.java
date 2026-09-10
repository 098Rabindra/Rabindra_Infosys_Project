package com.infosys.vault;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("com.infosys.vault.model")
@EnableJpaRepositories("com.infosys.vault.repository")
public class PasswordVaultApplication {

    public static void main(String[] args) {
        System.setProperty("java.net.preferIPv4Stack", "true"); 
        SpringApplication.run(PasswordVaultApplication.class, args);
    }
}
