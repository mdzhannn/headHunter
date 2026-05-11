package resume.vakansya.auth;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StartRegistrationRequest {
    private String fullName;
    private String email;
}
