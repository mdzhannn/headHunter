package resume.vakansya.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.List;

/**
 * Comma-separated {@link #allowedOriginPatterns} for Spring Security and MVC CORS.
 * Example production value: {@code https://your-app.vercel.app,https://*.vercel.app}
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.cors")
public class CorsProperties {

    /**
     * Comma-separated patterns, same semantics as {@link org.springframework.web.cors.CorsConfiguration#setAllowedOriginPatterns}.
     */
    private String allowedOriginPatterns = "http://localhost:*,http://127.0.0.1:*";

    public List<String> patternsList() {
        return Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
