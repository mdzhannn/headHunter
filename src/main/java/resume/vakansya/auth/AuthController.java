package resume.vakansya.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"})
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final CandidateAuthService candidateAuthService;

    @PostMapping("/register/send-email-otp")
    public ResponseEntity<Void> startRegistration(@RequestBody StartRegistrationRequest body) {
        if (body == null || body.getEmail() == null || body.getEmail().isBlank()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "email required");
        }
        if (body.getFullName() == null || body.getFullName().isBlank()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "fullName required");
        }
        candidateAuthService.startRegistration(body.getFullName(), body.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/register/verify-email-otp")
    public ResponseEntity<Void> verifyRegistrationOtp(@RequestBody VerifyRegistrationOtpRequest body) {
        if (body == null || body.getEmail() == null || body.getEmail().isBlank()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "email required");
        }
        candidateAuthService.verifyRegistrationOtp(body.getEmail(), body.getCode());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/register/complete")
    public AuthResponseDto completeRegistration(@RequestBody CompleteRegistrationRequest body) {
        if (body == null || body.getEmail() == null || body.getEmail().isBlank()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "email required");
        }
        return candidateAuthService.completeRegistration(body.getEmail(), body.getPassword());
    }

    @PostMapping("/login")
    public AuthResponseDto login(@RequestBody LoginRequest body) {
        if (body == null || body.getEmail() == null || body.getEmail().isBlank()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "email required");
        }
        return candidateAuthService.login(body.getEmail(), body.getPassword());
    }

    @PostMapping("/refresh")
    public AuthResponseDto refresh(@RequestBody RefreshTokenRequest body) {
        if (body == null || body.getRefreshToken() == null || body.getRefreshToken().isBlank()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "refreshToken required");
        }
        return candidateAuthService.refreshAccessToken(body.getRefreshToken());
    }

    @PostMapping("/password/send-reset-otp")
    public ResponseEntity<Void> sendResetOtp(@RequestBody SendPasswordResetOtpRequest body) {
        if (body == null || body.getEmail() == null || body.getEmail().isBlank()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "email required");
        }
        candidateAuthService.sendPasswordResetOtp(body.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/password/verify-otp")
    public ResponseEntity<Void> verifyResetOtp(@RequestBody VerifyPasswordResetOtpRequest body) {
        if (body == null || body.getEmail() == null || body.getEmail().isBlank()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "email required");
        }
        candidateAuthService.verifyPasswordResetOtp(body.getEmail(), body.getCode());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/password/reset")
    public ResponseEntity<Void> resetPassword(@RequestBody ResetPasswordRequest body) {
        if (body == null || body.getEmail() == null || body.getEmail().isBlank()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "email required");
        }
        candidateAuthService.resetPassword(body.getEmail(), body.getNewPassword());
        return ResponseEntity.ok().build();
    }
}
