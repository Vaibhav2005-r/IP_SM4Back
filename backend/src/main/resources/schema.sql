CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

CREATE TABLE sellers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    gst_number VARCHAR(15),
    trust_score DECIMAL(5, 2) DEFAULT 0.0
);

CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    description TEXT
);

CREATE TABLE stock_levels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT,
    quantity INT NOT NULL,
    low_stock_threshold INT DEFAULT 10,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT,
    transaction_type VARCHAR(50), -- 'SALE' or 'PURCHASE'
    quantity INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT,
    quantity INT NOT NULL,
    order_status VARCHAR(50), -- 'PENDING', 'APPROVED', 'REJECTED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE quotations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT,
    seller_id BIGINT,
    quoted_price DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'PENDING',
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (seller_id) REFERENCES sellers(id)
);

CREATE TABLE gst_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT,
    cgst DECIMAL(10, 2),
    sgst DECIMAL(10, 2),
    igst DECIMAL(10, 2),
    total_tax DECIMAL(10, 2),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

CREATE TABLE alerts_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_type VARCHAR(50), -- 'LOW_STOCK', 'OUT_OF_STOCK'
    message TEXT,
    sent_to VARCHAR(255),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
