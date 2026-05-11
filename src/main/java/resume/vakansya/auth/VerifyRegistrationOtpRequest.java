package resume.vakansya.auth;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyRegistrationOtpRequest {
    private String email;
    private String code;
}
