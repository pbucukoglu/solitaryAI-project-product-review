package com.productreview.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.productreview.dto.ProductDTO;
import com.productreview.dto.ProductDetailDTO;
import com.productreview.entity.Product;
import com.productreview.entity.Review;
import com.productreview.repository.ProductRepository;
import com.productreview.repository.ReviewRepository;
import com.productreview.spec.ProductSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {
    
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public Page<ProductDTO> getAllProducts(Pageable pageable, String category, String search, Integer minRating, BigDecimal minPrice, BigDecimal maxPrice) {
        Page<Product> products;
        
        boolean hasCategory = category != null && !category.isEmpty();
        boolean hasSearch = search != null && !search.isEmpty();
        boolean hasMinRating = minRating != null;
        boolean hasMinPrice = minPrice != null;
        boolean hasMaxPrice = maxPrice != null;
        
        if (hasSearch || hasMinRating || hasMinPrice || hasMaxPrice) {
            products = productRepository.findAll(
                    ProductSpecifications.categoryAndMultiTermSearch(
                            hasCategory ? category : null,
                            search,
                            minRating,
                            minPrice,
                            maxPrice
                    ),
                    pageable
            );
        } else if (hasCategory) {
            products = productRepository.findByCategory(category, pageable);
        } else {
            // No filters: get all
            products = productRepository.findAll(pageable);
        }
        
        List<Product> content = products.getContent();
        List<Long> productIds = content.stream().map(Product::getId).toList();

        Map<Long, Aggregate> aggregates = new HashMap<>();
        if (!productIds.isEmpty()) {
            for (Object[] row : reviewRepository.findAggregatesByProductIds(productIds)) {
                Long productId = (Long) row[0];
                Double avg = (Double) row[1];
                Long cnt = (Long) row[2];
                aggregates.put(productId, new Aggregate(avg, cnt));
            }
        }

        List<ProductDTO> dtoList = content.stream()
                .map(product -> convertToDTO(product, aggregates.get(product.getId())))
                .toList();

        return new PageImpl<>(dtoList, pageable, products.getTotalElements());
    }
    
    public ProductDetailDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        
        return convertToDetailDTO(product);
    }
    
    private List<String> parseImageUrls(String imageUrlsJson) {
        if (imageUrlsJson == null || imageUrlsJson.trim().isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(imageUrlsJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
    
    private ProductDTO convertToDTO(Product product, Aggregate aggregate) {
        List<String> imageUrls = parseImageUrls(product.getImageUrls());

        Double avgRating = aggregate != null ? aggregate.avgRating : 0.0;
        Long reviewCount = aggregate != null ? aggregate.reviewCount : 0L;
        
        return new ProductDTO(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getCategory(),
                product.getPrice(),
                imageUrls,
                avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0,
                reviewCount != null ? reviewCount : 0L
        );
    }
    
    private ProductDetailDTO convertToDetailDTO(Product product) {
        List<Review> reviews = reviewRepository.findByProductId(product.getId());
        List<String> imageUrls = parseImageUrls(product.getImageUrls());

        Double avgRating = reviewRepository.findAverageRatingByProductId(product.getId());
        Long reviewCount = reviewRepository.countByProductId(product.getId());
        
        List<com.productreview.dto.ReviewDTO> reviewDTOs = reviews.stream()
                .map(review -> new com.productreview.dto.ReviewDTO(
                        review.getId(),
                        review.getProduct().getId(),
                        review.getComment(),
                        review.getRating(),
                        review.getReviewerName(),
                        review.getDeviceId(),
                        review.getCreatedAt()
                ))
                .collect(Collectors.toList());
        
        return new ProductDetailDTO(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getCategory(),
                product.getPrice(),
                imageUrls,
                avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0,
                reviewCount != null ? reviewCount : 0L,
                reviewDTOs
        );
    }

    private record Aggregate(Double avgRating, Long reviewCount) {}
}


