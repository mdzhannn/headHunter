package resume.vakansya.candidate;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ComplaintRequest {
    private Long entityId;
    private String message;
}
