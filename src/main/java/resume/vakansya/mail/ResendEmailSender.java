package resume.vakansya.mail;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/**
 * Sends mail via Resend's HTTPS API: required on Render's free tier where SMTP is blocked.
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 *
 * <p>Sandbox sender {@code onboarding@resend.dev} can only deliver to the email used to sign up.
 * For arbitrary recipients verify a domain in the Resend dashboard and set {@code APP_MAIL_FROM}
 * to {@code something@your-verified-domain}.
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.mail", name = "provider", havingValue = "resend")
public class ResendEmailSender implements EmailSender {

    private final MailProperties mailProperties;
    private final RestClient restClient;

    public ResendEmailSender(MailProperties mailProperties) {
        this.mailProperties = mailProperties;
        this.restClient = RestClient.builder()
                .baseUrl(mailProperties.getResend().getEndpoint())
                .defaultHeader("Authorization", "Bearer " + mailProperties.getResend().getApiKey())
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @jakarta.annotation.PostConstruct
    void logMailConfig() {
        String key = mailProperties.getResend().getApiKey();
        log.info("[MAIL CFG resend] endpoint={} from={} apiKeyConfigured={} apiKeyLen={}",
                mailProperties.getResend().getEndpoint(),
                mailProperties.getFrom(),
                key != null && !key.isBlank(),
                key == null ? 0 : key.length());
    }

    @Override
    public void sendHtml(String toEmail, String subject, String htmlBody) {
        long t0 = System.currentTimeMillis();
        String from = mailProperties.getFrom();
        if (from == null || from.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "app.mail.from is required for Resend (must be on a verified domain or onboarding@resend.dev)");
        }
        if (mailProperties.getResend().getApiKey().isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "app.mail.resend.api-key is not configured");
        }

        log.info("[RESEND SEND] -> to={} from={} subject={}", toEmail, from, subject);
        Map<String, Object> payload = Map.of(
                "from", from,
                "to", List.of(toEmail),
                "subject", subject,
                "html", htmlBody);

        try {
            String body = restClient.post()
                    .body(payload)
                    .retrieve()
                    .body(String.class);
            log.info("[RESEND SEND] OK to={} elapsedMs={} responseLen={}",
                    toEmail, System.currentTimeMillis() - t0, body == null ? 0 : body.length());
        } catch (HttpStatusCodeException e) {
            String responseBody = e.getResponseBodyAsString();
            log.error("[RESEND SEND] FAILED HTTP {} to={} elapsedMs={} body={}",
                    e.getStatusCode(), toEmail, System.currentTimeMillis() - t0, responseBody, e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "email send failed: Resend HTTP " + e.getStatusCode() + ": " + responseBody);
        } catch (ResourceAccessException e) {
            log.error("[RESEND SEND] NETWORK FAILED to={} elapsedMs={} msg={}",
                    toEmail, System.currentTimeMillis() - t0, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "email send failed: network error: " + e.getMessage());
        } catch (Exception e) {
            log.error("[RESEND SEND] UNEXPECTED FAILED to={} elapsedMs={} msg={}",
                    toEmail, System.currentTimeMillis() - t0, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "email send failed: " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }
}
