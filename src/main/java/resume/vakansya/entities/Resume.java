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
    private boolean isVerify;
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<File> files = new ArrayList<>();



}
