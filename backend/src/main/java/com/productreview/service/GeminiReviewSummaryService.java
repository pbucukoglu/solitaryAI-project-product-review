package com.productreview.service;

import com.productreview.dto.ReviewSummaryResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class GeminiReviewSummaryService {
    private final ReviewSummaryService reviewSummaryService;

    public ReviewSummaryResponseDTO getReviewSummary(Long productId, int limit) {
        return reviewSummaryService.getReviewSummary(productId);
    }
}
