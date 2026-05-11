package resume.vakansya.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "resumes")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter

public class Resume {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;
    private String name;
    private String surname;
    private String patronymic;
    private Integer age;
    private String email;
    private String phone;
    private String gender;
    private Boolean married;
    private String education;
    private String location;
    private LocalDate birthDay;
    private String position;
    private Double salary;
    private String skills;
    private String workPlace;
    private String aboutMe;
    private String languages;
    private LocalDateTime createDate;
    private String status;

    @Column(columnDefinition = "TEXT")
    private String photoUrl;

    @Column(name = "is_verify", nullable = false)
    private Boolean isVerify = Boolean.FALSE;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private ModerationStatus moderationStatus = ModerationStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<File> files = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (createDate == null) {
            createDate = LocalDateTime.now();
        }
        if (moderationStatus == null) {
            moderationStatus = ModerationStatus.PENDING;
        }
        if (isVerify == null) {
            isVerify = Boolean.FALSE;
        }
    }

    @PostLoad
    void normalizeModeration() {
        if (moderationStatus == null) {
            moderationStatus = ModerationStatus.PENDING;
        }
    }



}
