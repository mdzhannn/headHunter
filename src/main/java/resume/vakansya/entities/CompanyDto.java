package resume.vakansya.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class CompanyDto {
    private Long id;
    private String name;
    private String inn;
    private String contacts;
    private String documents;
    private ModerationStatus moderationStatus;
    private String rejectionReason;
    private Long ownerId;
    private LocalDateTime createdAt;
}
