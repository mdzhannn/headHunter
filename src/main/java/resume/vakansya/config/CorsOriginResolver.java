package resume.vakansya.config;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsConfiguration;

/**
 * Same rules as {@link SecurityConfig#corsConfigurationSource()} — extracted for reuse
 * (e.g. CORS headers on error responses that skip normal CORS handling).
 */
@Component
@RequiredArgsConstructor
public class CorsOriginResolver {

    private final CorsProperties corsProperties;

    /**
     * @return exact origin to echo in {@code Access-Control-Allow-Origin}, or {@code null} if disallowed
     */
    public String resolve(String origin) {
        if (origin == null || origin.isBlank()) {
            return null;
        }
        CorsConfiguration probe = new CorsConfiguration();
        probe.setAllowedOriginPatterns(corsProperties.patternsList());
        String resolved = probe.checkOrigin(origin);
        if (resolved == null && origin.startsWith("https://") && origin.endsWith(".vercel.app")) {
            resolved = origin;
        }
        return resolved;
    }
}
