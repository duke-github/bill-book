package com.example.billbook.common.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        addColumnIfMissing("bill_record", "user_id",
                "ALTER TABLE bill_record ADD COLUMN user_id BIGINT NOT NULL DEFAULT 1 AFTER id");
        addIndexIfMissing("bill_record", "idx_user_record_date_id",
                "ALTER TABLE bill_record ADD INDEX idx_user_record_date_id (user_id, record_date, id)");
        addIndexIfMissing("bill_record", "idx_user_deleted_date",
                "ALTER TABLE bill_record ADD INDEX idx_user_deleted_date (user_id, deleted, record_date)");

        createTableIfMissing("monthly_budget", """
            CREATE TABLE IF NOT EXISTS monthly_budget (
                id BIGINT NOT NULL AUTO_INCREMENT,
                user_id BIGINT NOT NULL,
                year INT NOT NULL,
                month INT NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted TINYINT(1) NOT NULL DEFAULT 0,
                PRIMARY KEY (id),
                UNIQUE KEY uk_user_year_month (user_id, year, month, deleted),
                KEY idx_user_deleted (user_id, deleted)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """);
    }

    private void addColumnIfMissing(String tableName, String columnName, String sql) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
                """, Integer.class, tableName, columnName);
        if (count == null || count == 0) {
            jdbcTemplate.execute(sql);
        }
    }

    private void addIndexIfMissing(String tableName, String indexName, String sql) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND INDEX_NAME = ?
                """, Integer.class, tableName, indexName);
        if (count == null || count == 0) {
            jdbcTemplate.execute(sql);
        }
    }

    private void createTableIfMissing(String tableName, String sql) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                """, Integer.class, tableName);
        if (count == null || count == 0) {
            jdbcTemplate.execute(sql);
        }
    }
}
