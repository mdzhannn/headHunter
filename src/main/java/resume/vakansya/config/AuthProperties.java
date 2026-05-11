package resume.vakansya.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.auth")
public class AuthProperties {
    private String jwtSecret;
    private long jwtExpirationMs = 86_400_000L;
    private long refreshTokenExpirationMs = 2_592_000_000L;
    private int otpTtlMinutes = 5;
    private int otpRateWindowMinutes = 10;
    private int otpMaxSendsPerWindow = 3;
    private int otpMaxVerifyAttemptsPerChallenge = 5;
}
