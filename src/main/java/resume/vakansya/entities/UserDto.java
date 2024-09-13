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
    private LocalDateTime createDate;
    private boolean isActive;

}
