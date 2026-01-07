package com.productreview.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "review_helpful_votes",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_review_helpful_review_device", columnNames = {"review_id", "device_id"})
        },
        indexes = {
                @Index(name = "idx_review_helpful_review_id", columnList = "review_id"),
                @Index(name = "idx_review_helpful_device_id", columnList = "device_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewHelpfulVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @Column(name = "device_id", nullable = false, length = 128)
    private String deviceId;
}
