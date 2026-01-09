package com.productreview.controller;

import com.productreview.dto.ProductDTO;
import com.productreview.dto.ProductDetailDTO;
import com.productreview.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductController {
    
    private final ProductService productService;
    
    @GetMapping
    public ResponseEntity<Page<ProductDTO>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer minRating,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice
    ) {
        Sort sort;
        if ("averageRating".equals(sortBy)) {
            // Ensure products with no reviews appear last by sorting primarily on reviewCount DESC
            // (reviewCount=0 -> last), then on averageRating.
            Sort.Order ratingOrder = sortDir.equalsIgnoreCase("DESC")
                    ? Sort.Order.desc(sortBy).with(Sort.NullHandling.NULLS_LAST)
                    : Sort.Order.asc(sortBy).with(Sort.NullHandling.NULLS_LAST);

            sort = Sort.by(
                    Sort.Order.desc("reviewCount"),
                    ratingOrder
            );
        } else {
            sort = sortDir.equalsIgnoreCase("DESC")
                    ? Sort.by(sortBy).descending()
                    : Sort.by(sortBy).ascending();
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<ProductDTO> products = productService.getAllProducts(pageable, category, search, minRating, minPrice, maxPrice);
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProductDetailDTO> getProductById(@PathVariable Long id) {
        ProductDetailDTO product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }
}


