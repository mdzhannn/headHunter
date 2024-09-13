package resume.vakansya.entities;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter

public class ResumeDto {
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

}
