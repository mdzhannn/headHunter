package resume.vakansya.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;

/**
 * Comma-separated {@link #allowedOriginPatterns} for Spring Security and MVC CORS.
 * Example production value: {@code https://your-app.vercel.app,https://*.vercel.app}
 * <p>Patterns from env always <em>merge</em> with localhost + Vercel defaults so a minimal
 * {@code APP_CORS_ALLOWED_ORIGIN_PATTERNS} on PaaS cannot accidentally drop preview hosts.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.cors")
public class CorsProperties {

    /**
     * Comma-separated patterns, same semantics as {@link org.springframework.web.cors.CorsConfiguration#setAllowedOriginPatterns}.
     */
    private String allowedOriginPatterns = "http://localhost:*,http://127.0.0.1:*,https://*.vercel.app";

    public List<String> patternsList() {
        LinkedHashSet<String> merged = new LinkedHashSet<>();
        merged.addAll(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://*.vercel.app"));
        Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .forEach(merged::add);
        return List.copyOf(merged);
    }
}
