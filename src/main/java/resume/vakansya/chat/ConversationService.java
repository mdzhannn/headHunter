package resume.vakansya.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import resume.vakansya.chat.dto.ConversationListItemDto;
import resume.vakansya.chat.dto.MessageItemDto;
import resume.vakansya.chat.dto.UnreadTotalDto;
import resume.vakansya.entities.Conversation;
import resume.vakansya.entities.JobApplication;
import resume.vakansya.entities.Message;
import resume.vakansya.entities.User;
import resume.vakansya.entities.Vacancy;
import resume.vakansya.repositories.ConversationRepository;
import resume.vakansya.repositories.MessageRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    @Transactional
    public void ensureForApplication(JobApplication app) {
        if (conversationRepository.findByApplication_Id(app.getId()).isPresent()) {
            return;
        }
        User employer = app.getVacancy().getUser();
        if (employer == null) {
            return;
        }
        Conversation c = new Conversation();
        c.setApplication(app);
        c.setCandidateUserId(app.getUser().getId());
        c.setEmployerUserId(employer.getId());
        conversationRepository.save(c);
    }

    public boolean isParticipant(long conversationId, long userId) {
        return conversationRepository.findById(conversationId)
                .map(c -> userId == c.getCandidateUserId() || userId == c.getEmployerUserId())
                .orElse(false);
    }

    public void requireParticipant(long conversationId, long userId) {
        if (!conversationRepository.existsById(conversationId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found");
        }
        if (!isParticipant(conversationId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    public void requireParticipantStomp(long conversationId, long userId) {
        if (!isParticipant(conversationId, userId)) {
            throw new AccessDeniedException("Not a participant");
        }
    }

    @Transactional(readOnly = true)
    public List<ConversationListItemDto> listMy(long userId) {
        List<ConversationListItemDto> out = new ArrayList<>();
        for (Conversation c : conversationRepository.findAllForParticipant(userId)) {
            JobApplication app = c.getApplication();
            Vacancy v = app.getVacancy();
            User candUser = app.getUser();
            User vacUser = v.getUser();
            boolean imCandidate = userId == c.getCandidateUserId();
            String counterparty = imCandidate
                    ? (vacUser != null && vacUser.getUserName() != null ? vacUser.getUserName() : "Работодатель")
                    : (candUser.getUserName() != null ? candUser.getUserName() : "Соискатель");
            long unread = messageRepository.countByConversation_IdAndSenderIdNotAndReadAtIsNull(c.getId(), userId);
            out.add(new ConversationListItemDto(
                    c.getId(),
                    app.getId(),
                    v.getId(),
                    v.getJobTitle() != null ? v.getJobTitle() : "Вакансия",
                    counterparty,
                    c.getLastMessagePreview(),
                    c.getLastMessageAt(),
                    unread));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public UnreadTotalDto unreadTotal(long userId) {
        return new UnreadTotalDto(messageRepository.countUnreadForParticipant(userId));
    }

    @Transactional(readOnly = true)
    public List<MessageItemDto> getMessages(long conversationId, long userId) {
        requireParticipant(conversationId, userId);
        List<MessageItemDto> list = new ArrayList<>();
        for (Message m : messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversationId)) {
            list.add(toDto(m));
        }
        return list;
    }

    @Transactional
    public void markRead(long conversationId, long readerId) {
        requireParticipant(conversationId, readerId);
        messageRepository.markIncomingAsRead(conversationId, readerId, LocalDateTime.now());
    }

    @Transactional
    public MessageItemDto sendMessage(long conversationId, long senderUserId, String text) {
        if (text == null || text.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empty message");
        }
        Conversation c = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
        if (senderUserId != c.getCandidateUserId() && senderUserId != c.getEmployerUserId()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        Message m = new Message();
        m.setConversation(c);
        m.setSenderId(senderUserId);
        m.setText(text.trim());
        messageRepository.save(m);

        String preview = text.trim();
        if (preview.length() > 500) {
            preview = preview.substring(0, 500);
        }
        c.setLastMessageAt(m.getCreatedAt());
        c.setLastMessagePreview(preview);
        conversationRepository.save(c);

        return toDto(m);
    }

    private static MessageItemDto toDto(Message m) {
        return new MessageItemDto(
                m.getId(),
                m.getConversation().getId(),
                m.getSenderId(),
                m.getText(),
                m.getCreatedAt(),
                m.getReadAt());
    }
}
