package resume.vakansya.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "companies")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String inn;

    @Column(columnDefinition = "TEXT")
    private String contacts;

    @Column(columnDefinition = "TEXT")
    private String documents;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ModerationStatus moderationStatus = ModerationStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (moderationStatus == null) {
            moderationStatus = ModerationStatus.PENDING;
        }
    }
}
