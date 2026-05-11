package resume.vakansya.chat.dto;

import java.time.LocalDateTime;

public record ConversationListItemDto(
        long id,
        long applicationId,
        long vacancyId,
        String vacancyTitle,
        String counterpartyLabel,
        String lastMessagePreview,
        LocalDateTime lastMessageAt,
        long unreadCount
) {
}
