# FMC Regulations - New Backend Database Schema
# Designed for static HTML frontend + PHP API backend

CREATE TABLE IF NOT EXISTS fmc_companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    status ENUM('active','frozen','suspended','pending') DEFAULT 'active',
    category VARCHAR(100),
    regulator VARCHAR(100),
    type VARCHAR(100),
    risk ENUM('low','medium','high') DEFAULT 'medium',
    country VARCHAR(100),
    year_founded INT,
    website VARCHAR(500),
    logo VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fmc_complaints (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(16) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company_id INT,
    company_name VARCHAR(255),
    issue_type VARCHAR(100),
    category VARCHAR(100),
    description TEXT NOT NULL,
    amount_lost DECIMAL(18,2) DEFAULT 0,
    currency_lost VARCHAR(10) DEFAULT 'USD',
    status ENUM('pending','under_review','resolved','closed','payment_required') DEFAULT 'pending',
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    assigned_admin_id INT,
    payment_status ENUM('unpaid','paid') DEFAULT 'unpaid',
    otp VARCHAR(10),
    otp_expiry TIMESTAMP NULL,
    email_verified TINYINT DEFAULT 0,
    attachments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_email (email),
    KEY idx_reference (reference),
    KEY idx_status (status),
    CONSTRAINT fk_cmp_company FOREIGN KEY (company_id) REFERENCES fmc_companies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fmc_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id BIGINT UNSIGNED NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    filesize INT DEFAULT 0,
    filetype VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_complaint (complaint_id),
    CONSTRAINT fk_att_complaint FOREIGN KEY (complaint_id) REFERENCES fmc_complaints(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fmc_admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super','manager','staff') DEFAULT 'staff',
    phone VARCHAR(50),
    avatar VARCHAR(500),
    status ENUM('active','inactive') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_username (username),
    KEY idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fmc_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id BIGINT UNSIGNED NOT NULL,
    sender_type ENUM('user','admin') DEFAULT 'user',
    sender_id INT,
    sender_name VARCHAR(100),
    content TEXT NOT NULL,
    attachments TEXT,
    is_read TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_complaint (complaint_id),
    KEY idx_sender (sender_type, sender_id),
    CONSTRAINT fk_msg_complaint FOREIGN KEY (complaint_id) REFERENCES fmc_complaints(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fmc_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id BIGINT UNSIGNED NOT NULL,
    method VARCHAR(50) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status ENUM('pending','processing','completed','failed','refunded') DEFAULT 'pending',
    provider VARCHAR(50),
    transaction_id VARCHAR(255),
    card_last4 VARCHAR(4),
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_complaint (complaint_id),
    CONSTRAINT fk_pay_complaint FOREIGN KEY (complaint_id) REFERENCES fmc_complaints(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fmc_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_admin (admin_id),
    KEY idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
