package resume.vakansya.chat.dto;

import java.util.List;

/**
 * Мета-данные диалога + список сообщений за один запрос.
 * employerUserId нужен фронтенду, чтобы понять, является ли текущий пользователь работодателем.
 */
public record ConversationDetailDto(
        long id,
        long employerUserId,
        long candidateUserId,
        String vacancyTitle,
        String counterpartyLabel,
        List<MessageItemDto> messages
) {
}
