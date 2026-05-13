package resume.vakansya.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessagePreparator;
import resume.vakansya.config.AuthProperties;
import resume.vakansya.entities.OtpChallenge;
import resume.vakansya.entities.RefreshToken;
import resume.vakansya.entities.Role;
import resume.vakansya.entities.User;
import resume.vakansya.repositories.OtpChallengeRepository;
import resume.vakansya.repositories.RefreshTokenRepository;
import resume.vakansya.repositories.RoleRepository;
import resume.vakansya.repositories.UserRepository;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;
import jakarta.mail.Message;
import jakarta.mail.internet.InternetAddress;

@Slf4j
@Service
@RequiredArgsConstructor
public class CandidateAuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final AuthProperties authProperties;
    private final OtpChallengeRepository otpChallengeRepository;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JavaMailSender mailSender;
    private final EmailOtpTemplateService emailOtpTemplateService;

    @Value("${app.mail.from:}")
    private String mailFrom;

    @jakarta.annotation.PostConstruct
    void logMailConfig() {
        // No secrets in logs: only host/port/username presence and mailFrom domain
        Object host = "?";
        Object port = "?";
        Object username = "?";
        boolean hasPassword = false;
        if (mailSender instanceof org.springframework.mail.javamail.JavaMailSenderImpl impl) {
            host = impl.getHost();
            port = impl.getPort();
            username = impl.getUsername();
            hasPassword = impl.getPassword() != null && !impl.getPassword().isBlank();
        }
        log.info("[MAIL CFG] host={} port={} username={} hasPassword={} app.mail.from={}",
                host, port, username, hasPassword, mailFrom);
    }

    @Transactional
    public void startRegistration(String rawFullName, String rawEmail) {
        log.info("[OTP REGISTER] start raw email={} fullName={}", rawEmail, rawFullName);
        String fullName = normalizeFullName(rawFullName);
        String email = EmailNormalizer.normalize(rawEmail);
        log.info("[OTP REGISTER] normalized email={}", email);

        User existing = userRepository.findByPhone(email).orElse(null);
        if (existing != null && existing.getPassword() != null && !existing.getPassword().isBlank()) {
            log.warn("[OTP REGISTER] email already registered: {}", email);
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already registered");
        }
        LocalDateTime since = LocalDateTime.now().minusMinutes(authProperties.getOtpRateWindowMinutes());
        long sent = otpChallengeRepository.countByPhoneAndCreatedAtAfter(email, since);
        log.info("[OTP REGISTER] recent OTP requests for {}: {} (limit {})",
                email, sent, authProperties.getOtpMaxSendsPerWindow());
        if (sent >= authProperties.getOtpMaxSendsPerWindow()) {
            log.warn("[OTP REGISTER] rate limited: {}", email);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many OTP requests");
        }
        int code = 100000 + RANDOM.nextInt(900000);
        String plain = String.valueOf(code);
        otpChallengeRepository.deleteByPhone(email);
        OtpChallenge ch = new OtpChallenge();
        ch.setPhone(email);
        ch.setCodeHash(passwordEncoder.encode(plain));
        ch.setExpiresAt(LocalDateTime.now().plusMinutes(authProperties.getOtpTtlMinutes()));
        ch.setAttempts(0);
        ch.setFullName(fullName);
        ch.setVerifiedAt(null);
        otpChallengeRepository.save(ch);
        log.info("[OTP REGISTER] challenge saved, sending email to {}", email);
        sendHtmlEmail(
                email,
                emailOtpTemplateService.otpSubject(),
                emailOtpTemplateService.otpBody(plain, authProperties.getOtpTtlMinutes())
        );
        log.info("[OTP REGISTER] email sent successfully to {}", email);
    }

    @Transactional
    public void verifyRegistrationOtp(String rawEmail, String rawCode) {
        String email = EmailNormalizer.normalize(rawEmail);
        if (rawCode == null || rawCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "code required");
        }
        String code = rawCode.trim().replaceAll("\\s", "");
        OtpChallenge challenge = otpChallengeRepository.findFirstByPhoneOrderByCreatedAtDesc(email);
        if (challenge == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "no active challenge");
        }
        if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "code expired");
        }
        if (challenge.getAttempts() >= authProperties.getOtpMaxVerifyAttemptsPerChallenge()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "too many attempts");
        }
        if (!passwordEncoder.matches(code, challenge.getCodeHash())) {
            challenge.setAttempts(challenge.getAttempts() + 1);
            otpChallengeRepository.save(challenge);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid code");
        }

        challenge.setVerifiedAt(LocalDateTime.now());
        otpChallengeRepository.save(challenge);
        sendHtmlEmail(
                email,
                emailOtpTemplateService.emailConfirmedSubject(),
                emailOtpTemplateService.emailConfirmedBody()
        );
    }

    @Transactional
    public AuthResponseDto completeRegistration(String rawEmail, String rawPassword) {
        String email = EmailNormalizer.normalize(rawEmail);
        String password = validatePassword(rawPassword);
        OtpChallenge challenge = otpChallengeRepository.findFirstByPhoneOrderByCreatedAtDesc(email);
        if (challenge == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "no active challenge");
        }
        if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "code expired");
        }
        if (challenge.getVerifiedAt() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "email not verified");
        }

        User user = userRepository.findByPhone(email).orElseGet(User::new);
        Role role = roleRepository.findByName("CANDIDATE")
                .orElseThrow(() -> new IllegalStateException("Role CANDIDATE missing — run DB seed"));
        user.setPhone(email);
        user.setUserName(resolveUserName(challenge.getFullName(), email, user.getUserName()));
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setActive(true);
        if (user.getCreateDate() == null) {
            user.setCreateDate(LocalDateTime.now());
        }
        User saved = userRepository.save(user);
        otpChallengeRepository.deleteByPhone(email);
        sendHtmlEmail(
                email,
                emailOtpTemplateService.registrationCompletedSubject(),
                emailOtpTemplateService.registrationCompletedBody()
        );
        return issueToken(saved);
    }

    @Transactional
    public AuthResponseDto login(String rawEmail, String rawPassword) {
        String email = EmailNormalizer.normalize(rawEmail);
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password required");
        }
        User user = userRepository.findByPhone(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials"));
        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "account disabled");
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "password not set");
        }
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials");
        }
        return issueToken(user);
    }

    @Transactional
    public AuthResponseDto refreshAccessToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "refresh token required");
        }
        refreshTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        RefreshToken refresh = refreshTokenRepository.findByToken(rawRefreshToken.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid refresh token"));
        if (refresh.isRevoked() || refresh.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "refresh token expired");
        }
        User user = refresh.getUser();
        if (user == null || !user.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid refresh token");
        }
        refresh.setRevoked(true);
        refreshTokenRepository.save(refresh);
        return issueToken(user);
    }

    @Transactional
    public void sendPasswordResetOtp(String rawEmail) {
        String email = EmailNormalizer.normalize(rawEmail);
        User user = userRepository.findByPhone(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "account not found"));
        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "account disabled");
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password not set");
        }
        LocalDateTime since = LocalDateTime.now().minusMinutes(authProperties.getOtpRateWindowMinutes());
        long sent = otpChallengeRepository.countByPhoneAndCreatedAtAfter(email, since);
        if (sent >= authProperties.getOtpMaxSendsPerWindow()) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many OTP requests");
        }
        int code = 100000 + RANDOM.nextInt(900000);
        String plain = String.valueOf(code);
        otpChallengeRepository.deleteByPhone(email);
        OtpChallenge challenge = new OtpChallenge();
        challenge.setPhone(email);
        challenge.setCodeHash(passwordEncoder.encode(plain));
        challenge.setExpiresAt(LocalDateTime.now().plusMinutes(authProperties.getOtpTtlMinutes()));
        challenge.setAttempts(0);
        challenge.setFullName(null);
        challenge.setVerifiedAt(null);
        otpChallengeRepository.save(challenge);
        sendHtmlEmail(
                email,
                emailOtpTemplateService.passwordResetOtpSubject(),
                emailOtpTemplateService.passwordResetOtpBody(plain, authProperties.getOtpTtlMinutes())
        );
    }

    @Transactional
    public void verifyPasswordResetOtp(String rawEmail, String rawCode) {
        String email = EmailNormalizer.normalize(rawEmail);
        if (rawCode == null || rawCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "code required");
        }
        String code = rawCode.trim().replaceAll("\\s", "");
        OtpChallenge challenge = otpChallengeRepository.findFirstByPhoneOrderByCreatedAtDesc(email);
        if (challenge == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "no active challenge");
        }
        if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "code expired");
        }
        if (challenge.getAttempts() >= authProperties.getOtpMaxVerifyAttemptsPerChallenge()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "too many attempts");
        }
        if (!passwordEncoder.matches(code, challenge.getCodeHash())) {
            challenge.setAttempts(challenge.getAttempts() + 1);
            otpChallengeRepository.save(challenge);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid code");
        }
        challenge.setVerifiedAt(LocalDateTime.now());
        otpChallengeRepository.save(challenge);
        sendHtmlEmail(
                email,
                emailOtpTemplateService.passwordResetConfirmedSubject(),
                emailOtpTemplateService.passwordResetConfirmedBody()
        );
    }

    @Transactional
    public void resetPassword(String rawEmail, String rawNewPassword) {
        String email = EmailNormalizer.normalize(rawEmail);
        String newPassword = validatePassword(rawNewPassword);
        OtpChallenge challenge = otpChallengeRepository.findFirstByPhoneOrderByCreatedAtDesc(email);
        if (challenge == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "no active challenge");
        }
        if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "code expired");
        }
        if (challenge.getVerifiedAt() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "email not verified");
        }
        User user = userRepository.findByPhone(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "account not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        otpChallengeRepository.deleteByPhone(email);
        sendHtmlEmail(
                email,
                emailOtpTemplateService.passwordResetCompletedSubject(),
                emailOtpTemplateService.passwordResetCompletedBody()
        );
    }

    private AuthResponseDto issueToken(User user) {
        String token = jwtService.createToken(user);
        String refreshToken = createRefreshToken(user);
        long expSec = authProperties.getJwtExpirationMs() / 1000L;
        return new AuthResponseDto(token, refreshToken, "Bearer", expSec);
    }

    private String createRefreshToken(User user) {
        refreshTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        String value = UUID.randomUUID().toString() + "-" + UUID.randomUUID();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(value);
        refreshToken.setExpiresAt(LocalDateTime.now().plus(Duration.ofMillis(authProperties.getRefreshTokenExpirationMs())));
        refreshToken.setRevoked(false);
        refreshTokenRepository.save(refreshToken);
        return value;
    }

    private String normalizeFullName(String rawFullName) {
        if (rawFullName == null || rawFullName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fullName required");
        }
        String fullName = rawFullName.trim().replaceAll("\\s+", " ");
        if (fullName.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fullName too short");
        }
        if (fullName.length() > 160) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fullName too long");
        }
        return fullName;
    }

    private String validatePassword(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password required");
        }
        String password = rawPassword.trim();
        if (password.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password too short");
        }
        if (password.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password too long");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password uppercase required");
        }
        if (!password.matches(".*\\d.*")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password digit required");
        }
        return password;
    }

    private String resolveUserName(String challengeFullName, String email, String currentName) {
        if (challengeFullName != null && !challengeFullName.isBlank()) {
            return challengeFullName.trim();
        }
        if (currentName != null && !currentName.isBlank()) {
            return currentName;
        }
        int atIdx = email.indexOf('@');
        if (atIdx > 0) {
            return email.substring(0, atIdx);
        }
        return email;
    }

    private void sendHtmlEmail(String email, String subject, String htmlBody) {
        long t0 = System.currentTimeMillis();
        log.info("[SMTP SEND] -> to={} from={} subject={}", email, mailFrom, subject);
        try {
            MimeMessagePreparator preparator = mimeMessage -> {
                if (mailFrom != null && !mailFrom.isBlank()) {
                    mimeMessage.setFrom(new InternetAddress(mailFrom, "HeadHunter"));
                }
                mimeMessage.setRecipient(Message.RecipientType.TO, new InternetAddress(email));
                mimeMessage.setSubject(subject, "UTF-8");
                mimeMessage.setContent(htmlBody, "text/html; charset=UTF-8");
                mimeMessage.setSentDate(new Date());
                mimeMessage.setHeader("Content-Type", "text/html; charset=UTF-8");
            };
            mailSender.send(preparator);
            log.info("[SMTP SEND] OK to={} elapsedMs={}", email, System.currentTimeMillis() - t0);
        } catch (Exception e) {
            // Unwrap to show the root SMTP cause (AuthenticationFailedException, MessagingException, etc.)
            Throwable root = e;
            while (root.getCause() != null && root.getCause() != root) {
                root = root.getCause();
            }
            log.error("[SMTP SEND] FAILED to={} elapsedMs={} type={} msg={} rootType={} rootMsg={}",
                    email,
                    System.currentTimeMillis() - t0,
                    e.getClass().getName(),
                    e.getMessage(),
                    root.getClass().getName(),
                    root.getMessage(),
                    e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "email send failed: " + root.getClass().getSimpleName() + ": " + root.getMessage());
        }
    }
}
