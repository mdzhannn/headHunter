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
    private boolean isVerify;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

}
