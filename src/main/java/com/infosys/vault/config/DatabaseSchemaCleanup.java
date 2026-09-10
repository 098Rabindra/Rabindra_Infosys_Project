package com.infosys.vault.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.logging.Level;
import java.util.logging.Logger;

@Component
public class DatabaseSchemaCleanup implements CommandLineRunner {

    private static final Logger LOGGER = Logger.getLogger(DatabaseSchemaCleanup.class.getName());
    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaCleanup(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS otp, DROP COLUMN IF EXISTS status");
            LOGGER.info("Successfully dropped 'otp' and 'status' columns from 'users' table if present.");
        } catch (DataAccessException e) {
            LOGGER.log(Level.WARNING, "Could not execute column cleanup SQL for users: {0}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE vault_items ADD COLUMN IF NOT EXISTS permission_level VARCHAR(30) DEFAULT 'FULL_MANAGEMENT'");
            jdbcTemplate.execute("UPDATE vault_items SET permission_level = 'FULL_MANAGEMENT' WHERE permission_level IS NULL");
            jdbcTemplate.execute("ALTER TABLE vault_items DROP CONSTRAINT IF EXISTS vault_items_category_check");
            jdbcTemplate.execute("ALTER TABLE vault_items DROP CONSTRAINT IF EXISTS vault_items_permission_level_check");
            jdbcTemplate.execute("ALTER TABLE vault_items DROP COLUMN IF EXISTS passcode, DROP COLUMN IF EXISTS recipient_email, DROP COLUMN IF EXISTS sender_email, DROP COLUMN IF EXISTS share_payload, DROP COLUMN IF EXISTS is_shared");
            LOGGER.info("Successfully ensured schema consistency and dropped unused columns (passcode, recipient_email, sender_email, share_payload, is_shared) from 'vault_items' table.");
        } catch (DataAccessException e) {
            LOGGER.log(Level.WARNING, "Could not execute column schema update for vault_items: {0}", e.getMessage());
        }
    }
}
