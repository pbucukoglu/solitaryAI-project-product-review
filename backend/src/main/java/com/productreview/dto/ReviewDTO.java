package com.productreview.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDTO {
    private Long id;
    private Long productId;
    private String comment;
    private Integer rating;
    private String reviewerName;
    private String deviceId;
    private Long helpfulCount;
    private LocalDateTime createdAt;
}
