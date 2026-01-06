package com.productreview.repository;

import com.productreview.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    Page<Review> findByProductId(Long productId, Pageable pageable);

    @Query("SELECT r FROM Review r WHERE r.product.id = :productId AND (:minRating IS NULL OR r.rating >= :minRating)")
    Page<Review> findByProductIdFiltered(
            @Param("productId") Long productId,
            @Param("minRating") Integer minRating,
            Pageable pageable
    );
    
    List<Review> findByProductId(Long productId);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double findAverageRatingByProductId(@Param("productId") Long productId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    Long countByProductId(@Param("productId") Long productId);

    @Query("SELECT r.product.id, AVG(r.rating), COUNT(r) FROM Review r WHERE r.product.id IN :productIds GROUP BY r.product.id")
    List<Object[]> findAggregatesByProductIds(@Param("productIds") List<Long> productIds);
}


