package resume.vakansya.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class AdminNotificationPayload {
    private String type;
    private String message;
    private Long entityId;
    private LocalDateTime createdAt;
}
