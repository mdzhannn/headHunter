package resume.vakansya.repositories;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import resume.vakansya.entities.ModerationStatus;
import resume.vakansya.entities.Resume;

import java.util.List;

@Repository
@Transactional
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    Resume findAllById(Long id);

    java.util.Optional<Resume> findByUser_Id(Long userId);

    List<Resume> findByModerationStatus(ModerationStatus moderationStatus);

    @Query("SELECT r FROM Resume r WHERE r.moderationStatus IS NULL OR r.moderationStatus = resume.vakansya.entities.ModerationStatus.PENDING")
    List<Resume> findPendingOrLegacy();

    @Query("SELECT COUNT(r) FROM Resume r WHERE r.moderationStatus IS NULL OR r.moderationStatus = resume.vakansya.entities.ModerationStatus.PENDING")
    long countPendingOrLegacy();
}
