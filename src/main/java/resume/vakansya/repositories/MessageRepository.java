package resume.vakansya.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import resume.vakansya.entities.Message;

import java.time.LocalDateTime;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversation_IdOrderByCreatedAtAsc(long conversationId);

    long countByConversation_IdAndSenderIdNotAndReadAtIsNull(long conversationId, long excludedSenderId);

    @Query("""
            select count(m) from Message m join m.conversation c
            where (c.candidateUserId = :userId or c.employerUserId = :userId)
              and m.senderId <> :userId
              and m.readAt is null
            """)
    long countUnreadForParticipant(@Param("userId") long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Message m set m.readAt = :at
            where m.conversation.id = :conversationId
              and m.senderId <> :readerId
              and m.readAt is null
            """)
    int markIncomingAsRead(
            @Param("conversationId") long conversationId,
            @Param("readerId") long readerId,
            @Param("at") LocalDateTime at);
}
