package resume.vakansya.candidate;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CandidateApplicationItemDto {
    private Long id;
    private Long vacancyId;
    private String vacancyTitle;
    private String companyName;
    private LocalDateTime createdAt;
    private String status;
}
