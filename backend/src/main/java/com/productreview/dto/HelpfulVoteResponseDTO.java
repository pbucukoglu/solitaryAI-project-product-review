package com.productreview.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HelpfulVoteResponseDTO {
    private Long reviewId;
    private Long helpfulCount;
    private boolean helpfulByMe;
}
