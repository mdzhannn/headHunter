package resume.vakansya.audit;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class AuditLogDto {
    private Long id;
    private String adminEmail;
    private String action;
    private String entityType;
    private Long entityId;
    private String oldValue;
    private LocalDateTime changedAt;
}
