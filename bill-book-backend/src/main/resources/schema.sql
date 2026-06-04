CREATE TABLE IF NOT EXISTS app_user (
    id BIGINT NOT NULL AUTO_INCREMENT,
    openid VARCHAR(128) NOT NULL,
    unionid VARCHAR(128) NULL,
    nickname VARCHAR(64) NULL,
    avatar_url VARCHAR(512) NULL,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_openid (openid),
    KEY idx_deleted_created_at (deleted, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bill_record (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type VARCHAR(16) NOT NULL,
    category_code VARCHAR(64) NOT NULL,
    category_name VARCHAR(64) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    remark VARCHAR(255) NULL,
    record_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_user_record_date_id (user_id, record_date, id),
    KEY idx_user_type_date (user_id, type, record_date),
    KEY idx_user_deleted_date (user_id, deleted, record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
