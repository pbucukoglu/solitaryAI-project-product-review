package com.productreview.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;

@Slf4j
@Configuration
@RequiredArgsConstructor
@Profile("postgres")
public class DatabaseInitializer {

    private final JdbcTemplate jdbcTemplate;

    @Bean
    public CommandLineRunner initializeDatabase() {
        return args -> {
            log.info("Starting database initialization...");
            
            // Check if database is already initialized
            if (isDatabaseInitialized()) {
                log.info("Database already initialized, skipping...");
                return;
            }

            // Create tables
            createProductsTable();
            createReviewsTable();
            
            // Seed data
            seedProducts();
            updateProductImages();
            
            markDatabaseInitialized();
            log.info("Database initialization completed successfully!");
        };
    }

    private boolean isDatabaseInitialized() {
        try {
            // Check if schema_version table exists (from Flyway) or our custom table
            jdbcTemplate.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'schema_version'", Integer.class);
            
            // Check if products table has data
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM products", Integer.class);
            return count != null && count > 0;
        } catch (Exception e) {
            // Tables don't exist yet
            return false;
        }
    }

    private void createProductsTable() {
        log.info("Creating products table...");
        String sql = """
            CREATE TABLE IF NOT EXISTS products (
                id BIGSERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description VARCHAR(1000),
                category VARCHAR(255) NOT NULL,
                price NUMERIC(10, 2) NOT NULL,
                image_urls TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
            CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
            CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
            """;
        
        jdbcTemplate.execute(sql);
        log.info("Products table created successfully");
    }

    private void createReviewsTable() {
        log.info("Creating reviews table...");
        String sql = """
            CREATE TABLE IF NOT EXISTS reviews (
                id BIGSERIAL PRIMARY KEY,
                product_id BIGINT NOT NULL,
                comment VARCHAR(2000) NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                reviewer_name VARCHAR(255),
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );
            
            CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
            CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
            CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
            """;
        
        jdbcTemplate.execute(sql);
        log.info("Reviews table created successfully");
    }

    private void seedProducts() {
        log.info("Seeding products...");
        
        // Check if products already exist
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM products", Integer.class);
        if (count != null && count > 0) {
            log.info("Products already exist, skipping seed...");
            return;
        }

        String sql = """
            INSERT INTO products (name, description, category, price, image_urls, created_at) VALUES
            ('iPhone 15 Pro', 'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system.', 'Electronics', 999.99, NULL, CURRENT_TIMESTAMP),
            ('Samsung Galaxy S24', 'Flagship Android phone with AI features and stunning display.', 'Electronics', 899.99, NULL, CURRENT_TIMESTAMP),
            ('MacBook Pro 16"', 'Powerful laptop with M3 chip, perfect for professionals.', 'Electronics', 2499.99, NULL, CURRENT_TIMESTAMP),
            ('iPad Pro 12.9"', 'Latest iPad with M2 chip and stunning Liquid Retina XDR display.', 'Electronics', 1099.99, NULL, CURRENT_TIMESTAMP),
            ('Sony WH-1000XM5 Headphones', 'Industry-leading noise canceling with exceptional sound quality.', 'Electronics', 399.99, NULL, CURRENT_TIMESTAMP),
            ('Nintendo Switch OLED', 'Enhanced gaming console with vibrant 7-inch OLED screen.', 'Electronics', 349.99, NULL, CURRENT_TIMESTAMP),
            ('Canon EOS R6 Mark II', 'Professional mirrorless camera with 24.2MP full-frame sensor.', 'Electronics', 2499.99, NULL, CURRENT_TIMESTAMP),
            ('Apple Watch Series 9', 'Advanced smartwatch with health monitoring and fitness tracking.', 'Electronics', 399.99, NULL, CURRENT_TIMESTAMP),
            ('Samsung 55" QLED TV', '4K QLED Smart TV with Quantum Dot technology and HDR.', 'Electronics', 1299.99, NULL, CURRENT_TIMESTAMP),
            ('AirPods Pro 2', 'Active noise cancellation with spatial audio and adaptive EQ.', 'Electronics', 249.99, NULL, CURRENT_TIMESTAMP),
            ('DJI Mini 4 Pro Drone', 'Compact drone with 4K video and advanced obstacle sensing.', 'Electronics', 759.99, NULL, CURRENT_TIMESTAMP),
            ('PlayStation 5', 'Next-gen gaming console with ray tracing and 3D audio.', 'Electronics', 499.99, NULL, CURRENT_TIMESTAMP),
            ('Xbox Series X', 'Most powerful Xbox console with 4K gaming and fast loading.', 'Electronics', 499.99, NULL, CURRENT_TIMESTAMP),
            ('LG 27" 4K Monitor', 'Ultra HD monitor with HDR10 and USB-C connectivity.', 'Electronics', 349.99, NULL, CURRENT_TIMESTAMP),
            ('Logitech MX Master 3S', 'Premium wireless mouse with precision tracking and ergonomic design.', 'Electronics', 99.99, NULL, CURRENT_TIMESTAMP),
            ('Nike Air Max 90', 'Classic sneakers with comfortable cushioning and timeless design.', 'Clothing', 120.00, NULL, CURRENT_TIMESTAMP),
            ('Levi''s 501 Jeans', 'Original fit jeans, iconic straight leg design.', 'Clothing', 89.99, NULL, CURRENT_TIMESTAMP),
            ('Adidas Ultraboost 22', 'Premium running shoes with responsive cushioning.', 'Clothing', 180.00, NULL, CURRENT_TIMESTAMP),
            ('Patagonia Down Jacket', 'Warm and lightweight down jacket for outdoor adventures.', 'Clothing', 249.99, NULL, CURRENT_TIMESTAMP),
            ('The North Face Backpack', 'Durable hiking backpack with multiple compartments.', 'Clothing', 129.99, NULL, CURRENT_TIMESTAMP),
            ('Ray-Ban Aviator Sunglasses', 'Classic aviator style with UV protection lenses.', 'Clothing', 154.99, NULL, CURRENT_TIMESTAMP),
            ('Champion Hoodie', 'Comfortable cotton blend hoodie with classic design.', 'Clothing', 59.99, NULL, CURRENT_TIMESTAMP),
            ('Vans Old Skool', 'Iconic skate shoes with durable canvas and suede.', 'Clothing', 65.00, NULL, CURRENT_TIMESTAMP),
            ('Tommy Hilfiger Polo Shirt', 'Classic polo shirt with embroidered logo.', 'Clothing', 79.99, NULL, CURRENT_TIMESTAMP),
            ('New Balance 990v5', 'Premium running shoes with superior comfort and support.', 'Clothing', 185.00, NULL, CURRENT_TIMESTAMP),
            ('The Pragmatic Programmer', 'Your journey to mastery in software development.', 'Books', 39.99, NULL, CURRENT_TIMESTAMP),
            ('Clean Code', 'A Handbook of Agile Software Craftsmanship.', 'Books', 49.99, NULL, CURRENT_TIMESTAMP),
            ('Design Patterns: Elements of Reusable OOP', 'Gang of Four classic on software design patterns.', 'Books', 54.99, NULL, CURRENT_TIMESTAMP),
            ('You Don''t Know JS', 'Deep dive into JavaScript language mechanics.', 'Books', 44.99, NULL, CURRENT_TIMESTAMP),
            ('System Design Interview', 'Complete guide to system design interview questions.', 'Books', 34.99, NULL, CURRENT_TIMESTAMP),
            ('The Art of Computer Programming', 'Donald Knuth''s comprehensive guide to algorithms.', 'Books', 79.99, NULL, CURRENT_TIMESTAMP),
            ('Refactoring: Improving the Design of Existing Code', 'Martin Fowler''s guide to code refactoring.', 'Books', 47.99, NULL, CURRENT_TIMESTAMP),
            ('Introduction to Algorithms', 'Comprehensive textbook on algorithms and data structures.', 'Books', 89.99, NULL, CURRENT_TIMESTAMP),
            ('Dyson V15 Detect', 'Cordless vacuum with laser technology and powerful suction.', 'Home & Kitchen', 749.99, NULL, CURRENT_TIMESTAMP),
            ('Instant Pot Duo', '7-in-1 pressure cooker, slow cooker, rice cooker, and more.', 'Home & Kitchen', 99.99, NULL, CURRENT_TIMESTAMP),
            ('KitchenAid Stand Mixer', 'Professional 5-quart stand mixer with 10 speeds.', 'Home & Kitchen', 379.99, NULL, CURRENT_TIMESTAMP),
            ('Nespresso Vertuo Coffee Maker', 'Premium coffee machine with capsule system.', 'Home & Kitchen', 199.99, NULL, CURRENT_TIMESTAMP),
            ('Le Creuset Dutch Oven', 'Enameled cast iron 5.5-quart Dutch oven.', 'Home & Kitchen', 349.99, NULL, CURRENT_TIMESTAMP),
            ('Vitamix Blender', 'Professional-grade blender with 64-ounce container.', 'Home & Kitchen', 449.99, NULL, CURRENT_TIMESTAMP),
            ('Breville Smart Oven', 'Convection toaster oven with 13 cooking functions.', 'Home & Kitchen', 249.99, NULL, CURRENT_TIMESTAMP),
            ('Yoga Mat Premium', 'Non-slip yoga mat with carrying strap, 6mm thickness.', 'Sports & Outdoors', 34.99, NULL, CURRENT_TIMESTAMP),
            ('Peloton Bike', 'Interactive exercise bike with live and on-demand classes.', 'Sports & Outdoors', 1445.00, NULL, CURRENT_TIMESTAMP),
            ('Garmin Forerunner 955', 'Advanced GPS running watch with training metrics.', 'Sports & Outdoors', 599.99, NULL, CURRENT_TIMESTAMP),
            ('Yeti Rambler 30oz', 'Insulated stainless steel tumbler keeps drinks cold or hot.', 'Sports & Outdoors', 45.99, NULL, CURRENT_TIMESTAMP),
            ('Coleman Camping Tent', '4-person dome tent with weatherproof design.', 'Sports & Outdoors', 89.99, NULL, CURRENT_TIMESTAMP);
            """;
        
        jdbcTemplate.execute(sql);
        log.info("Products seeded successfully");
    }

    private void updateProductImages() {
        log.info("Updating product images...");
        
        // Update all products with multi-angle images
        String[] updates = {
            // Electronics: Smartphones
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&fit=crop&q=80\"]' WHERE name = 'iPhone 15 Pro'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&fit=crop&q=80\"]' WHERE name = 'Samsung Galaxy S24'",
            
            // Electronics: Laptops and Tablets
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&fit=crop&q=80\"]' WHERE name = 'MacBook Pro 16\"'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1561154464-82e9adf5c833?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1561154464-82e9adf5c833?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&fit=crop&q=80\"]' WHERE name = 'iPad Pro 12.9\"'",
            
            // Electronics: Audio Devices
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&fit=crop&q=80\"]' WHERE name = 'Sony WH-1000XM5 Headphones'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&fit=crop&q=80\"]' WHERE name = 'AirPods Pro 2'",
            
            // Electronics: Gaming Consoles
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&fit=crop&q=80\"]' WHERE name = 'Nintendo Switch OLED'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&fit=crop&q=80\"]' WHERE name = 'PlayStation 5'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&fit=crop&q=80\"]' WHERE name = 'Xbox Series X'",
            
            // Electronics: Cameras and Other
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&fit=crop&q=80\"]' WHERE name = 'Canon EOS R6 Mark II'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&fit=crop&q=80\"]' WHERE name = 'Apple Watch Series 9'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&fit=crop&q=80\"]' WHERE name = 'Samsung 55\" QLED TV'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&fit=crop&q=80\"]' WHERE name = 'DJI Mini 4 Pro Drone'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&fit=crop&q=80\"]' WHERE name = 'LG 27\" 4K Monitor'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&fit=crop&q=80\"]' WHERE name = 'Logitech MX Master 3S'",
            
            // Clothing: Shoes
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&fit=crop&q=80\"]' WHERE name = 'Nike Air Max 90'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&fit=crop&q=80\"]' WHERE name = 'Adidas Ultraboost 22'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&fit=crop&q=80\"]' WHERE name = 'Vans Old Skool'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&fit=crop&q=80\"]' WHERE name = 'New Balance 990v5'",
            
            // Clothing: Jeans and Apparel
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&fit=crop&q=80\"]' WHERE name = 'Levi''s 501 Jeans'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&fit=crop&q=80\"]' WHERE name = 'Patagonia Down Jacket'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&fit=crop&q=80\"]' WHERE name = 'The North Face Backpack'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&fit=crop&q=80\"]' WHERE name = 'Ray-Ban Aviator Sunglasses'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&fit=crop&q=80\"]' WHERE name = 'Champion Hoodie'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&fit=crop&q=80\"]' WHERE name = 'Tommy Hilfiger Polo Shirt'",
            
            // Books
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&fit=crop&q=80\"]' WHERE category = 'Books'",
            
            // Home & Kitchen
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&fit=crop&q=80\"]' WHERE category = 'Home & Kitchen' AND name != 'Nespresso Vertuo Coffee Maker'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&fit=crop&q=80\"]' WHERE name = 'Nespresso Vertuo Coffee Maker'",
            
            // Sports & Outdoors
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&fit=crop&q=80\"]' WHERE name = 'Yoga Mat Premium'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&fit=crop&q=80\"]' WHERE name = 'Peloton Bike'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&fit=crop&q=80\"]' WHERE name = 'Garmin Forerunner 955'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&fit=crop&q=80\"]' WHERE name = 'Yeti Rambler 30oz'",
            "UPDATE products SET image_urls = '[\"https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&fit=crop&q=80\", \"https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&fit=crop&q=80\"]' WHERE name = 'Coleman Camping Tent'"
        };

        for (String update : updates) {
            try {
                jdbcTemplate.execute(update);
            } catch (Exception e) {
                log.warn("Failed to update product images: {}", e.getMessage());
            }
        }
        
        log.info("Product images updated successfully");
    }

    private void markDatabaseInitialized() {
        // Optional: Create a table to track initialization
        // For now, we just check if products exist
    }
}

