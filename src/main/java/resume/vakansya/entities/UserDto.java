package resume.vakansya.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter

public class UserDto {
    private Long id;
    private String userName;
    private String password;
    /** Логин OTP: телефон (+7…) или email (уникальный ключ users.phone) */
    private String phone;
    /** Email из профиля резюме (если есть), для отображения в админке */
    private String email;
    private LocalDateTime createDate;
    private boolean isActive;
    private String roleName;
    private String adminRoleName;

}
