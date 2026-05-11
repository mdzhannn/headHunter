package resume.vakansya.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import resume.vakansya.entities.Conversation;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByApplication_Id(long applicationId);

    @Query("""
            select c from Conversation c
            where c.candidateUserId = :userId or c.employerUserId = :userId
            order by c.lastMessageAt desc nulls last, c.id desc
            """)
    List<Conversation> findAllForParticipant(@Param("userId") long userId);
}
