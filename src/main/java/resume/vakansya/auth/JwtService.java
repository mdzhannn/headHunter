package resume.vakansya.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import resume.vakansya.config.AuthProperties;
import resume.vakansya.entities.User;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final AuthProperties authProperties;

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(authProperties.getJwtSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String createToken(User user) {
        SecretKey key = signingKey();
        Instant now = Instant.now();
        Instant exp = now.plusMillis(authProperties.getJwtExpirationMs());
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("phone", user.getPhone())
                .claim("role", user.getRole() != null ? user.getRole().getName() : "")
                .claim("adminRole", resolveAdminRoleClaim(user))
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public Long parseUserId(String authorizationHeader) {
        Claims claims = parseClaims(authorizationHeader);
        return Long.parseLong(claims.getSubject());
    }

    public String parseRole(String authorizationHeader) {
        Claims claims = parseClaims(authorizationHeader);
        Object role = claims.get("role");
        return role == null ? "" : String.valueOf(role);
    }

    public String parseAdminRole(String authorizationHeader) {
        Claims claims = parseClaims(authorizationHeader);
        Object adminRole = claims.get("adminRole");
        return adminRole == null ? "" : String.valueOf(adminRole);
    }

    private String resolveAdminRoleClaim(User user) {
        if (user.getAdminRole() != null && user.getAdminRole().getName() != null) {
            return user.getAdminRole().getName();
        }
        String role = user.getRole() != null ? user.getRole().getName() : "";
        if ("ADMIN".equals(role)) {
            return "SUPER_ADMIN";
        }
        return "";
    }

    private Claims parseClaims(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing token");
        }
        String token = authorizationHeader.substring(7).trim();
        try {
            return Jwts.parser()
                    .verifyWith(signingKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token");
        }
    }
}
