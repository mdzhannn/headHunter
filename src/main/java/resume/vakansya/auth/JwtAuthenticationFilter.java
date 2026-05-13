package resume.vakansya.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return HttpMethod.OPTIONS.matches(request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            try {
                Long userId = jwtService.parseUserId(auth);
                String role = jwtService.parseRole(auth);
                String adminRole = jwtService.parseAdminRole(auth);
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                if ("CANDIDATE".equals(role) || "BOTH".equals(role)) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_CANDIDATE"));
                }
                if ("EMPLOYER".equals(role) || "BOTH".equals(role)) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_EMPLOYER"));
                }
                if ("ADMIN".equals(role)) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                    if (adminRole != null && !adminRole.isBlank()) {
                        authorities.add(new SimpleGrantedAuthority(adminRole.trim().toUpperCase()));
                    } else {
                        authorities.add(new SimpleGrantedAuthority("SUPER_ADMIN"));
                    }
                }
                if (!authorities.isEmpty()) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userId,
                                    null,
                                    authorities);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception ignored) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
