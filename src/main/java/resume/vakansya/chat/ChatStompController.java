package resume.vakansya.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import resume.vakansya.chat.dto.ChatSendPayload;
import resume.vakansya.chat.dto.MessageItemDto;

@Controller
@RequiredArgsConstructor
public class ChatStompController {

    private final ConversationService conversationService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void send(ChatSendPayload payload, Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Long userId)) {
            throw new AccessDeniedException("Unauthorized");
        }
        MessageItemDto saved = conversationService.sendMessage(payload.conversationId(), userId, payload.text());
        messagingTemplate.convertAndSend("/topic/conversation." + saved.conversationId(), saved);
    }
}
