package com.productreview.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "reviews",
        indexes = {
                @Index(name = "idx_reviews_product_id", columnList = "product_id"),
                @Index(name = "idx_reviews_product_id_created_at", columnList = "product_id, created_at"),
                @Index(name = "idx_reviews_product_id_rating", columnList = "product_id, rating"),
                @Index(name = "idx_reviews_product_id_helpful", columnList = "product_id, helpful_count")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Review {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(nullable = false, length = 2000)
    private String comment;
    
    @Column(nullable = false)
    private Integer rating;
    
    @Column(name = "reviewer_name")
    private String reviewerName;

    @Column(name = "device_id", length = 128)
    private String deviceId;

    @Column(name = "helpful_count", nullable = false)
    private Long helpfulCount = 0L;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}


