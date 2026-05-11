package resume.vakansya.auth;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendPasswordResetOtpRequest {
    private String email;
}
