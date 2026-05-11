package resume.vakansya.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import resume.vakansya.entities.AuditLog;

import java.time.LocalDateTime;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("""
            select a
            from AuditLog a
            where (:entityType is null or lower(a.entityType) = lower(:entityType))
              and (:adminEmail is null or lower(a.adminEmail) like lower(concat('%', :adminEmail, '%')))
              and (:fromDate is null or a.changedAt >= :fromDate)
              and (:toDate is null or a.changedAt <= :toDate)
            """)
    Page<AuditLog> search(
            @Param("entityType") String entityType,
            @Param("adminEmail") String adminEmail,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );
}
