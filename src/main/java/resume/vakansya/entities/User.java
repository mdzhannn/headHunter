package resume.vakansya.entities;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
@Entity
@Table(name = "users")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter

public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String userName;
    /** Для админских/старых учёток; соискатели с OTP могут иметь null */
    @Column(nullable = true)
    private String password;
    /** Нормализованный номер (E.164) или email-идентификатор для OTP-входа */
    @Column(unique = true, length = 128)
    private String phone;
    private LocalDateTime createDate;
    private boolean isActive;


    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;

    @ManyToOne
    @JoinColumn(name = "admin_role_id")
    private AdminRole adminRole;
    @OneToOne(mappedBy = "user")
    private Resume resume;
    @OneToOne(mappedBy = "user")
    private Vacancy vacancy;
}