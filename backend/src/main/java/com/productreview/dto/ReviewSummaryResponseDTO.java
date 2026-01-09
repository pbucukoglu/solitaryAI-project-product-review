package com.productreview.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewSummaryResponseDTO {
    private String source;
    private Double averageRating;
    private Long reviewCount;
    private List<String> pros;
    private List<String> cons;
}
