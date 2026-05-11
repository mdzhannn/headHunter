package resume.vakansya.auth;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyPasswordResetOtpRequest {
    private String email;
    private String code;
}
