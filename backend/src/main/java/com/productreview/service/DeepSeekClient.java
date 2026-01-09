package com.productreview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DeepSeekClient {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(3);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(5);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build();

    public SummaryResult summarize(String prompt) {
        String apiKey = System.getenv("DEEPSEEK_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "DEEPSEEK_API_KEY is not configured");
        }

        try {
            Map<String, Object> req = new HashMap<>();
            req.put("model", "deepseek-chat");
            req.put("temperature", 0.2);
            req.put("messages", List.of(
                    Map.of(
                            "role", "system",
                            "content", "Output JSON only: {\"pros\":[max 3],\"cons\":[max 3]}. Do NOT mention AI. Do NOT hallucinate. Base strictly on provided reviews."
                    ),
                    Map.of(
                            "role", "user",
                            "content", prompt
                    )
            ));

            String body = objectMapper.writeValueAsString(req);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.deepseek.com/v1/chat/completions"))
                    .timeout(REQUEST_TIMEOUT)
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new DeepSeekClientException(response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode contentNode = root
                    .path("choices")
                    .path(0)
                    .path("message")
                    .path("content");

            if (contentNode.isMissingNode() || contentNode.asText().trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "DeepSeek returned empty response");
            }

            String raw = contentNode.asText();
            String json = extractJsonObject(raw);
            JsonNode parsed = objectMapper.readTree(json);

            List<String> pros = asStringList(parsed.path("pros"));
            List<String> cons = asStringList(parsed.path("cons"));

            return new SummaryResult(pros, cons);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (DeepSeekClientException e) {
            throw e;
        } catch (Exception e) {
            throw new DeepSeekClientException(-1);
        }
    }

    private List<String> asStringList(JsonNode node) {
        if (node == null || !node.isArray()) return List.of();
        List<String> out = new ArrayList<>();
        for (JsonNode n : node) {
            if (n == null) continue;
            String v = n.asText(null);
            if (v == null) continue;
            String t = v.trim();
            if (t.isEmpty()) continue;
            if (t.length() > 120) t = t.substring(0, 120);
            if (out.contains(t)) continue;
            out.add(t);
            if (out.size() >= 3) break;
        }
        return out;
    }

    private String extractJsonObject(String raw) {
        String s = raw == null ? "" : raw.trim();
        int start = s.indexOf('{');
        int end = s.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new DeepSeekClientException(-1);
        }
        return s.substring(start, end + 1);
    }

    public record SummaryResult(List<String> pros, List<String> cons) {}

    public static final class DeepSeekClientException extends RuntimeException {
        private final int providerStatusCode;

        public DeepSeekClientException(int providerStatusCode) {
            this.providerStatusCode = providerStatusCode;
        }

        public int getProviderStatusCode() {
            return providerStatusCode;
        }
    }
}
