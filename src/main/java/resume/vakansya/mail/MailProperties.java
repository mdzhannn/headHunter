package resume.vakansya.mail;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {

    /** Sender address used in the From header (must be on a Resend-verified domain). */
    private String from = "";

    /** {@code smtp} or {@code resend}. Default {@code smtp} for local dev. */
    private String provider = "smtp";

    private final Resend resend = new Resend();

    @Getter
    @Setter
    public static class Resend {
        /** API key from https://resend.com/api-keys. Inject via env {@code APP_MAIL_RESEND_API_KEY}. */
        private String apiKey = "";

        /** Endpoint, normally https://api.resend.com/emails. */
        private String endpoint = "https://api.resend.com/emails";
    }
}
