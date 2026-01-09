package com.productreview.repository;

import com.productreview.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    
    Page<Product> findByCategory(String category, Pageable pageable);

    @Query(
            value = "SELECT p FROM Product p LEFT JOIN p.reviews r GROUP BY p ORDER BY COUNT(r) DESC, COALESCE(AVG(r.rating), 0) DESC",
            countQuery = "SELECT COUNT(p) FROM Product p"
    )
    Page<Product> findAllOrderByReviewAggregates(Pageable pageable);

    @Query(
            value = "SELECT p FROM Product p LEFT JOIN p.reviews r WHERE p.category = :category GROUP BY p ORDER BY COUNT(r) DESC, COALESCE(AVG(r.rating), 0) DESC",
            countQuery = "SELECT COUNT(p) FROM Product p WHERE p.category = :category"
    )
    Page<Product> findByCategoryOrderByReviewAggregates(@Param("category") String category, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Product> searchProducts(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.category = :category AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) ")
    Page<Product> findByCategoryAndSearch(@Param("category") String category, @Param("searchTerm") String searchTerm, Pageable pageable);
    
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.reviews WHERE p.id = :id")
    Optional<Product> findByIdWithReviews(@Param("id") Long id);
}


