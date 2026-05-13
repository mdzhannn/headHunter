package resume.vakansya.mail;

/**
 * Provider-agnostic email sender. Implementations:
 * - {@code SmtpEmailSender}   (Spring Mail / Gmail) — works locally
 * - {@code ResendEmailSender} (HTTPS API)            — works on Render free tier where SMTP is blocked
 *
 * Selection: property {@code app.mail.provider=smtp|resend} (default smtp).
 */
public interface EmailSender {

    void sendHtml(String toEmail, String subject, String htmlBody);
}
