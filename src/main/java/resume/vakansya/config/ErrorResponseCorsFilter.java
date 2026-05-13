package resume.vakansya.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Error responses (4xx/5xx) sometimes bypass the default CORS filter pipeline; the browser then
 * reports a CORS failure even when the real issue is e.g. 502 from failed SMTP. Echo ACAO on errors
 * when Origin is allowed so the client sees the real status in DevTools.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
@RequiredArgsConstructor
public class ErrorResponseCorsFilter extends OncePerRequestFilter {

    private final CorsOriginResolver corsOriginResolver;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String origin = request.getHeader(HttpHeaders.ORIGIN);
        String allowed = corsOriginResolver.resolve(origin);
        if (allowed == null) {
            filterChain.doFilter(request, response);
            return;
        }

        var wrapped = new HttpServletResponseWrapper(response) {

            private void ensureCorsOnError(int code) {
                if (code < 400) {
                    return;
                }
                if (getHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN) != null) {
                    return;
                }
                setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, allowed);
                setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
                addHeader(HttpHeaders.VARY, HttpHeaders.ORIGIN);
            }

            @Override
            public void setStatus(int sc) {
                super.setStatus(sc);
                ensureCorsOnError(sc);
            }

            @Override
            public void sendError(int sc) throws IOException {
                ensureCorsOnError(sc);
                super.sendError(sc);
            }

            @Override
            public void sendError(int sc, String msg) throws IOException {
                ensureCorsOnError(sc);
                super.sendError(sc, msg);
            }
        };

        filterChain.doFilter(request, wrapped);
    }
}
