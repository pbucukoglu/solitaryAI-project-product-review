
package com.productreview.service;

import com.productreview.dto.ReviewSummaryResponseDTO;
import com.productreview.entity.Product;
import com.productreview.entity.Review;
import com.productreview.repository.ProductRepository;
import com.productreview.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewSummaryService {

    private static final Logger log = LoggerFactory.getLogger(ReviewSummaryService.class);

    private static final int REVIEW_LIMIT = 20;

    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;
    private final DeepSeekClient deepSeekClient;

    public ReviewSummaryResponseDTO getReviewSummary(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        List<Review> latest = reviewRepository.findLatestByProductId(productId, PageRequest.of(0, REVIEW_LIMIT));

        List<Review> usable = new ArrayList<>();
        for (Review r : latest) {
            if (r == null) continue;
            String c = r.getComment();
            if (c == null) continue;
            if (c.trim().isEmpty()) continue;
            usable.add(r);
        }

        if (usable.isEmpty()) {
            Summary local = buildLocalSummary(latest);
            return new ReviewSummaryResponseDTO(
                    "LOCAL",
                    product.getAverageRating(),
                    product.getReviewCount(),
                    local.pros,
                    local.cons
            );
        }

        try {
            String prompt = buildPrompt(product.getName(), usable);
            DeepSeekClient.SummaryResult ai = deepSeekClient.summarize(prompt);
            Summary cleaned = sanitizeAi(ai);
            return new ReviewSummaryResponseDTO(
                    "AI",
                    product.getAverageRating(),
                    product.getReviewCount(),
                    cleaned.pros,
                    cleaned.cons
            );
        } catch (Exception e) {
            if (e instanceof ResponseStatusException rse) {
                log.warn("DeepSeek review summary failed (status={}): falling back to local summary", rse.getStatusCode());
            } else if (e instanceof DeepSeekClient.DeepSeekClientException dse) {
                log.warn("DeepSeek review summary failed (provider_status={}): falling back to local summary", dse.getProviderStatusCode());
            } else {
                log.warn("DeepSeek review summary failed ({}): falling back to local summary", e.getClass().getSimpleName());
            }
            Summary local = buildLocalSummary(latest);
            return new ReviewSummaryResponseDTO(
                    "LOCAL",
                    product.getAverageRating(),
                    product.getReviewCount(),
                    local.pros,
                    local.cons
            );
        }
    }

    private String buildPrompt(String productName, List<Review> reviews) {
        StringBuilder sb = new StringBuilder();
        sb.append("Product: ").append(productName == null ? "" : productName).append("\n");
        sb.append("Reviews (rating + comment):\n");
        for (Review r : reviews) {
            sb.append("- ").append(r.getRating()).append("/5: ").append(sanitize(r.getComment())).append("\n");
        }
        sb.append("\nReturn JSON only: {\"pros\":[max 3 short bullet points],\"cons\":[max 3 short bullet points]}.\n");
        sb.append("Do not hallucinate features. Base statements strictly on reviews.\n");
        sb.append("Do not mention AI.\n");
        return sb.toString();
    }

    private Summary sanitizeAi(DeepSeekClient.SummaryResult ai) {
        List<String> pros = cleanList(ai == null ? null : ai.pros());
        List<String> cons = cleanList(ai == null ? null : ai.cons());
        return new Summary(pros, cons);
    }

    private List<String> cleanList(List<String> input) {
        if (input == null || input.isEmpty()) return List.of();
        List<String> out = new ArrayList<>();
        for (String s : input) {
            if (s == null) continue;
            String t = s.trim();
            if (t.isEmpty()) continue;
            if (t.length() > 120) t = t.substring(0, 120);
            out.add(t);
            if (out.size() >= 3) break;
        }
        return out;
    }

    private Summary buildLocalSummary(List<Review> reviews) {
        Map<String, Integer> pros = new HashMap<>();
        Map<String, Integer> cons = new HashMap<>();

        for (Review r : reviews) {
            if (r == null) continue;
            String c = r.getComment();
            if (c == null) continue;
            String text = c.toLowerCase(Locale.ROOT);
            if (text.trim().isEmpty()) continue;

            boolean positive = r.getRating() != null && r.getRating() >= 4;
            boolean negative = r.getRating() != null && r.getRating() <= 2;

            for (String theme : themes()) {
                if (!text.contains(theme)) continue;
                if (positive) pros.put(theme, pros.getOrDefault(theme, 0) + 1);
                if (negative) cons.put(theme, cons.getOrDefault(theme, 0) + 1);
            }
        }

        List<String> topPros = topThemes(pros);
        List<String> topCons = topThemes(cons);

        return new Summary(topPros, topCons);
    }

    private List<String> themes() {
        return List.of(
                "battery",
                "price",
                "performance",
                "build",
                "quality",
                "screen",
                "display",
                "camera",
                "sound",
                "speaker",
                "shipping",
                "delivery",
                "size",
                "weight",
                "durable",
                "software"
        );
    }

    private List<String> topThemes(Map<String, Integer> counts) {
        if (counts.isEmpty()) return List.of();
        List<Map.Entry<String, Integer>> entries = new ArrayList<>(counts.entrySet());
        entries.sort((a, b) -> Integer.compare(b.getValue(), a.getValue()));
        List<String> out = new ArrayList<>();
        List<String> seen = new ArrayList<>();
        for (Map.Entry<String, Integer> e : entries) {
            String label = humanizeTheme(e.getKey());
            if (seen.contains(label)) continue;
            seen.add(label);
            out.add(label);
            if (out.size() >= 3) break;
        }
        return out;
    }

    private String humanizeTheme(String theme) {
        return switch (theme) {
            case "battery" -> "Battery life";
            case "price" -> "Price/value";
            case "performance" -> "Performance";
            case "build", "quality" -> "Build quality";
            case "screen", "display" -> "Display";
            case "camera" -> "Camera";
            case "sound", "speaker" -> "Sound";
            case "shipping", "delivery" -> "Shipping/delivery";
            case "size", "weight" -> "Size/weight";
            case "durable" -> "Durability";
            case "software" -> "Software";
            default -> theme;
        };
    }

    private String sanitize(String text) {
        if (text == null) return "";
        String t = text.replace("\r", " ").replace("\n", " ").trim();
        if (t.length() > 500) {
            return t.substring(0, 500);
        }
        return t;
    }

    private static final class Summary {
        private final List<String> pros;
        private final List<String> cons;

        private Summary(List<String> pros, List<String> cons) {
            this.pros = pros == null ? List.of() : pros;
            this.cons = cons == null ? List.of() : cons;
        }
    }
}

