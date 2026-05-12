package resume.vakansya.employer;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import resume.vakansya.entities.ResumeDto;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployerApplicationItemDto {
    private Long id;
    private Long vacancyId;
    private String vacancyTitle;
    private LocalDateTime createdAt;
    private String status;
    /** Резюме таким, каким оно было на момент отклика (или текущее для старых откликов). */
    private ResumeDto resumeAtApply;
    /** Беседа по отклику; null если чат ещё не создан (старые данные). */
    private Long conversationId;
}
