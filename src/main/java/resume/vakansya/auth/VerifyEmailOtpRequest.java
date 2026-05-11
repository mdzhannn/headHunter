package resume.vakansya.auth;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyEmailOtpRequest {
    private String email;
    private String code;
}
