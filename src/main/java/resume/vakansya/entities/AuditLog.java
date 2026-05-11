package resume.vakansya.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_changed_at", columnList = "changedAt"),
        @Index(name = "idx_audit_entity_type", columnList = "entityType"),
        @Index(name = "idx_audit_admin_email", columnList = "adminEmail")
})
@Getter
@Setter
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String adminEmail;

    @Column(nullable = false, length = 64)
    private String action;

    @Column(nullable = false, length = 64)
    private String entityType;

    @Column
    private Long entityId;

    @Column(columnDefinition = "TEXT")
    private String oldValue;

    @Column(nullable = false)
    private LocalDateTime changedAt;

    @PrePersist
    void prePersist() {
        if (changedAt == null) {
            changedAt = LocalDateTime.now();
        }
    }
}
