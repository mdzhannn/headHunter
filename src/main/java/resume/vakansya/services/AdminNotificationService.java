package resume.vakansya.services;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import resume.vakansya.chat.dto.AdminNotificationPayload;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void userCreated(Long userId) {
        publish("USER_CREATED", "Создан новый пользователь", userId);
    }

    public void vacancySubmittedForModeration(Long vacancyId) {
        publish("VACANCY_SUBMITTED", "Вакансия отправлена на модерацию", vacancyId);
    }

    public void complaintCreated(Long complaintId) {
        publish("COMPLAINT_CREATED", "Поступила новая жалоба", complaintId);
    }

    public void complaintCreated(Long complaintId, String details) {
        String suffix = (details == null || details.isBlank()) ? "" : (": " + details.trim());
        publish("COMPLAINT_CREATED", "Поступила новая жалоба" + suffix, complaintId);
    }

    private void publish(String type, String message, Long entityId) {
        AdminNotificationPayload payload = new AdminNotificationPayload(
                type,
                message,
                entityId,
                LocalDateTime.now()
        );
        messagingTemplate.convertAndSend("/topic/admin-notifications", payload);
    }
}
