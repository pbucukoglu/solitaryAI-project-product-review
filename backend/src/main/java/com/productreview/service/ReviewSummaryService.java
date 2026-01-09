
package com.productreview.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReviewSummaryService {
    private final GroqReviewSummaryService groqReviewSummaryService;
}

