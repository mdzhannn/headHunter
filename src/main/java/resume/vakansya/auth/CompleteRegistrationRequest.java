package resume.vakansya.auth;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompleteRegistrationRequest {
    private String email;
    private String password;
}
