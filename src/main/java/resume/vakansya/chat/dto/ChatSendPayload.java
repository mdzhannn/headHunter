package resume.vakansya.chat.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ChatSendPayload(long conversationId, String text) {
}
