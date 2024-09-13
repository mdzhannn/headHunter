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
    private String password;
    private LocalDateTime createDate;
    private boolean isActive;


    @OneToOne
    @JoinColumn(name = "role_id")
    private Role role;
    @OneToOne(mappedBy = "user")
    private Resume resume;
    @OneToOne(mappedBy = "user")
    private Vacancy vacancy;
}