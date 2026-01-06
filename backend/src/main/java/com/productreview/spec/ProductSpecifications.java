package com.productreview.spec;

import com.productreview.entity.Product;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    public static Specification<Product> categoryAndMultiTermSearch(
            String category,
            String search,
            Integer minRating,
            BigDecimal minPrice,
            BigDecimal maxPrice
    ) {
        final String trimmed = search == null ? "" : search.trim();
        final String[] rawTerms = trimmed.split("\\s+");

        final List<String> terms = new ArrayList<>();
        for (String t : rawTerms) {
            if (t != null) {
                String tt = t.trim();
                if (!tt.isEmpty()) {
                    terms.add(tt.toLowerCase());
                }
            }
        }

        return (root, query, cb) -> {
            List<Predicate> andPredicates = new ArrayList<>();

            if (category != null && !category.trim().isEmpty()) {
                andPredicates.add(cb.equal(root.get("category"), category));
            }

            if (minRating != null) {
                andPredicates.add(cb.greaterThanOrEqualTo(cb.coalesce(root.get("averageRating"), 0.0), minRating.doubleValue()));
            }

            if (minPrice != null) {
                andPredicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            if (maxPrice != null) {
                andPredicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            for (String term : terms) {
                String like = "%" + term + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), like);
                Predicate descLike = cb.like(cb.lower(root.get("description")), like);
                andPredicates.add(cb.or(nameLike, descLike));
            }

            if (andPredicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(andPredicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Product> categoryAndMultiTermSearch(String category, String search) {
        return categoryAndMultiTermSearch(category, search, null, null, null);
    }
}
