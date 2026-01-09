package com.productreview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.productreview.dto.ReviewSummaryDTO;
import com.productreview.dto.ReviewSummaryResponseDTO;
import com.productreview.entity.Product;
import com.productreview.entity.Review;
import com.productreview.repository.ProductRepository;
import com.productreview.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class GroqReviewSummaryService {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration CACHE_TTL = Duration.ofMinutes(10);

    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build();

    private final Map<Long, CacheEntry> cache = new ConcurrentHashMap<>();

    public ReviewSummaryResponseDTO getReviewSummary(Long productId, int limit) {
        CacheEntry cached = cache.get(productId);
        if (cached != null && !cached.isExpired()) {
            return cached.value;
        }

        String apiKey = System.getenv("GROQ_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "GROQ_API_KEY is not configured");
        }

        String model = System.getenv("GROQ_MODEL");
        if (model == null || model.trim().isEmpty()) {
            model = "llama-3.3-70b-versatile";
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id: " + productId));

        int safeLimit = Math.max(1, Math.min(100, limit));

        List<Review> latest = reviewRepository.findLatestByProductId(productId, PageRequest.of(0, safeLimit));
        List<Review> usable = new ArrayList<>();
        for (Review r : latest) {
            if (r == null) continue;
            String c = r.getComment();
            if (c == null) continue;
            if (c.trim().isEmpty()) continue;
            usable.add(r);
        }

        if (usable.isEmpty()) {
            ReviewSummaryResponseDTO response = new ReviewSummaryResponseDTO(
                    productId,
                    0L,
                    new ReviewSummaryDTO("No reviews yet.", List.of(), List.of(), List.of()),
                    Instant.now().toString(),
                    "none"
            );
            cache.put(productId, new CacheEntry(response));
            return response;
        }

        String prompt = buildPrompt(product, usable);

        ReviewSummaryDTO summary;
        try {
            summary = callGroq(apiKey, prompt);
        } catch (ResponseStatusException e) {
            if (e.getStatusCode() == HttpStatus.SERVICE_UNAVAILABLE) {
                throw e;
            }
            throw e;
        }

        ReviewSummaryResponseDTO response = new ReviewSummaryResponseDTO(
                productId,
                (long) usable.size(),
                summary,
                Instant.now().toString(),
                "groq"
        );

        cache.put(productId, new CacheEntry(response));
        return response;
    }

    private String buildPrompt(Product product, List<Review> reviews) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an assistant that summarizes product reviews in a conservative, e-commerce style. ");
        sb.append("Return ONLY a raw JSON object with keys: takeaway (string), pros (array of strings), cons (array of strings), topTopics (array of strings). ");
        sb.append("Use neutral language like 'Most users mention...' or 'Some users report...'. ");
        sb.append("Avoid absolute claims, adjectives like 'amazing'/'terrible', and emojis. ");
        sb.append("Group feedback into common e-commerce topics: Battery, Performance, Price, Build quality, Camera, Delivery, Comfort. ");
        sb.append("Max 3 pros/cons, max 5 topics. No markdown, no code fences, no extra text.\n\n");

        sb.append("Product:\n");
        sb.append("name: ").append(product.getName()).append("\n");
        sb.append("category: ").append(product.getCategory()).append("\n");
        sb.append("price: ").append(product.getPrice()).append("\n");
        sb.append("averageRating: ").append(product.getAverageRating()).append("\n");
        sb.append("reviewCount: ").append(product.getReviewCount()).append("\n\n");

        sb.append("Latest reviews (rating + comment):\n");
        for (Review r : reviews) {
            sb.append("- rating: ").append(r.getRating()).append("\n");
            sb.append("  comment: ").append(sanitize(r.getComment())).append("\n");
        }

        sb.append("\nGuidelines:\n");
        sb.append("- Write 1 neutral takeaway sentence.\n");
        sb.append("- Extract up to 3 pros and 3 cons as short phrases.\n");
        sb.append("- Extract up to 5 common e-commerce topics.\n");
        sb.append("- Use conservative, factual language.\n");

        return sb.toString();
    }

    private ReviewSummaryDTO callGroq(String apiKey, String prompt) {
        try {
            String model = System.getenv("GROQ_MODEL");
            if (model == null || model.trim().isEmpty()) {
                model = "llama-3.3-70b-versatile";
            }

            Map<String, Object> req = new HashMap<>();
            req.put("model", model);
            req.put("temperature", 0.2);
            req.put("messages", List.of(
                    Map.of(
                            "role", "system",
                            "content", "Return ONLY a raw JSON object with keys: takeaway (string), pros (array of strings), cons (array of strings), topTopics (array of strings). Use neutral language like 'Most users mention...' or 'Some users report...'. Avoid absolute claims, adjectives like 'amazing'/'terrible', and emojis. Group feedback into common e-commerce topics: Battery, Performance, Price, Build quality, Camera, Delivery, Comfort. Max 3 pros/cons, max 5 topics. No markdown, no code fences, no extra text."
                    ),
                    Map.of(
                            "role", "user",
                            "content", prompt
                    )
            ));

            String body = objectMapper.writeValueAsString(req);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .timeout(REQUEST_TIMEOUT)
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String snippet = safeSnippet(response.body());
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Groq call failed with status " + response.statusCode() + (snippet.isEmpty() ? "" : (": " + snippet))
                );
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode contentNode = root
                    .path("choices")
                    .path(0)
                    .path("message")
                    .path("content");

            if (contentNode.isMissingNode() || contentNode.asText().trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Groq returned empty response");
            }

            String raw = contentNode.asText();
            String json = extractJsonObject(raw);
            JsonNode parsed = objectMapper.readTree(json);

            String takeaway = parsed.path("takeaway").asText(null);
            List<String> pros = asStringList(parsed.path("pros"));
            List<String> cons = asStringList(parsed.path("cons"));
            List<String> topTopics = asStringList(parsed.path("topTopics"));
            if (takeaway == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Groq response missing takeaway");
            }
            return new ReviewSummaryDTO(takeaway, pros, cons, topTopics);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Groq call failed");
        }
    }

    private String safeSnippet(String body) {
        if (body == null) return "";
        String t = body.replace("\r", " ").replace("\n", " ").trim();
        if (t.isEmpty()) return "";
        return t.length() > 500 ? t.substring(0, 500) : t;
    }

    private List<String> asStringList(JsonNode node) {
        List<String> out = new ArrayList<>();
        if (node == null || !node.isArray()) return out;
        for (JsonNode n : node) {
            if (n == null) continue;
            String v = n.asText(null);
            if (v == null) continue;
            String t = v.trim();
            if (t.isEmpty()) continue;
            out.add(t);
        }
        return out;
    }

    private String extractJsonObject(String raw) {
        String s = raw == null ? "" : raw.trim();
        int start = s.indexOf('{');
        int end = s.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Groq response was not valid JSON");
        }
        return s.substring(start, end + 1);
    }

    private String sanitize(String text) {
        if (text == null) return "";
        String t = text.replace("\r", " ").replace("\n", " ").trim();
        if (t.length() > 500) {
            return t.substring(0, 500);
        }
        return t;
    }

    private static final class CacheEntry {
        private final ReviewSummaryResponseDTO value;
        private final Instant createdAt;

        private CacheEntry(ReviewSummaryResponseDTO value) {
            this.value = value;
            this.createdAt = Instant.now();
        }

        private boolean isExpired() {
            return Instant.now().isAfter(createdAt.plus(CACHE_TTL));
        }
    }
}
