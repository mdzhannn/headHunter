package resume.vakansya.chat.dto;

import java.time.LocalDateTime;

public record MessageItemDto(
        long id,
        long conversationId,
        long senderId,
        String text,
        LocalDateTime createdAt,
        LocalDateTime readAt
) {
}
