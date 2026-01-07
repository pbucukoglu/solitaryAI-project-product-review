package com.productreview.repository;

import com.productreview.entity.ReviewHelpfulVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewHelpfulVoteRepository extends JpaRepository<ReviewHelpfulVote, Long> {

    Optional<ReviewHelpfulVote> findByReviewIdAndDeviceId(Long reviewId, String deviceId);

    long countByReviewId(Long reviewId);
}
