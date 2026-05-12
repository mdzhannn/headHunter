package resume.vakansya.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import resume.vakansya.candidate.CandidateSecurity;
import resume.vakansya.chat.dto.ConversationDetailDto;
import resume.vakansya.chat.dto.ConversationListItemDto;
import resume.vakansya.chat.dto.MessageItemDto;
import resume.vakansya.chat.dto.UnreadTotalDto;

import java.util.List;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @GetMapping("/my")
    public List<ConversationListItemDto> my() {
        return conversationService.listMy(CandidateSecurity.requireUserId());
    }

    @GetMapping("/unread-total")
    public UnreadTotalDto unreadTotal() {
        return conversationService.unreadTotal(CandidateSecurity.requireUserId());
    }

    @GetMapping("/{id}")
    public ConversationDetailDto detail(@PathVariable long id) {
        return conversationService.getDetail(id, CandidateSecurity.requireUserId());
    }

    @GetMapping("/{id}/messages")
    public List<MessageItemDto> messages(@PathVariable long id) {
        return conversationService.getMessages(id, CandidateSecurity.requireUserId());
    }

    @PostMapping("/{id}/read")
    public void read(@PathVariable long id) {
        conversationService.markRead(id, CandidateSecurity.requireUserId());
    }
}
