package resume.vakansya.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
@Entity
@Table(name = "vacancies")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Vacancy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String jobTitle;
    private String aboutCompany;
    private String location;
    private String requirements;
    private Double salary;
    private String workType;
    private String experience;
    private String aboutVacancy;
    private LocalDateTime createDate;
    private String status;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private ModerationStatus moderationStatus = ModerationStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "is_verify", nullable = false)
    private Boolean isVerify = false;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @PrePersist
    void prePersist() {
        if (createDate == null) {
            createDate = LocalDateTime.now();
        }
        if (moderationStatus == null) {
            moderationStatus = ModerationStatus.PENDING;
        }
        if (isVerify == null) {
            isVerify = false;
        }
    }

    @PostLoad
    void normalizeModeration() {
        if (moderationStatus == null) {
            moderationStatus = ModerationStatus.PENDING;
        }
    }

}
