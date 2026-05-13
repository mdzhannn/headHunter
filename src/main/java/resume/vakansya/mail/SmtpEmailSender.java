package resume.vakansya.mail;

import jakarta.mail.Message;
import jakarta.mail.internet.InternetAddress;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Date;

/**
 * Default provider for local dev. {@link #logMailConfig()} dumps non-secret SMTP config at boot.
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.mail", name = "provider", havingValue = "smtp", matchIfMissing = true)
@RequiredArgsConstructor
public class SmtpEmailSender implements EmailSender {

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    @jakarta.annotation.PostConstruct
    void logMailConfig() {
        Object host = "?";
        Object port = "?";
        Object username = "?";
        boolean hasPassword = false;
        if (mailSender instanceof JavaMailSenderImpl impl) {
            host = impl.getHost();
            port = impl.getPort();
            username = impl.getUsername();
            hasPassword = impl.getPassword() != null && !impl.getPassword().isBlank();
        }
        log.info("[MAIL CFG smtp] host={} port={} username={} hasPassword={} from={}",
                host, port, username, hasPassword, mailProperties.getFrom());
    }

    @Override
    public void sendHtml(String toEmail, String subject, String htmlBody) {
        long t0 = System.currentTimeMillis();
        String from = mailProperties.getFrom();
        log.info("[SMTP SEND] -> to={} from={} subject={}", toEmail, from, subject);
        try {
            MimeMessagePreparator preparator = mimeMessage -> {
                if (from != null && !from.isBlank()) {
                    mimeMessage.setFrom(new InternetAddress(from, "HeadHunter"));
                }
                mimeMessage.setRecipient(Message.RecipientType.TO, new InternetAddress(toEmail));
                mimeMessage.setSubject(subject, "UTF-8");
                mimeMessage.setContent(htmlBody, "text/html; charset=UTF-8");
                mimeMessage.setSentDate(new Date());
                mimeMessage.setHeader("Content-Type", "text/html; charset=UTF-8");
            };
            mailSender.send(preparator);
            log.info("[SMTP SEND] OK to={} elapsedMs={}", toEmail, System.currentTimeMillis() - t0);
        } catch (Exception e) {
            Throwable root = e;
            while (root.getCause() != null && root.getCause() != root) {
                root = root.getCause();
            }
            log.error("[SMTP SEND] FAILED to={} elapsedMs={} type={} rootType={} rootMsg={}",
                    toEmail,
                    System.currentTimeMillis() - t0,
                    e.getClass().getName(),
                    root.getClass().getName(),
                    root.getMessage(),
                    e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "email send failed: " + root.getClass().getSimpleName() + ": " + root.getMessage());
        }
    }
}
