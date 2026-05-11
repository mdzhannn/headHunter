package resume.vakansya.repositories;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import resume.vakansya.entities.ModerationStatus;
import resume.vakansya.entities.Vacancy;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Pageable;

@Repository
@Transactional
public interface VacancyRepository extends JpaRepository<Vacancy,Long>, JpaSpecificationExecutor<Vacancy> {
    Vacancy findAllById(Long id);
    List<Vacancy> findByModerationStatus(ModerationStatus moderationStatus);

    @Query("SELECT v FROM Vacancy v WHERE v.moderationStatus IS NULL OR v.moderationStatus = resume.vakansya.entities.ModerationStatus.PENDING")
    List<Vacancy> findPendingOrLegacy();

    @Query("SELECT COUNT(v) FROM Vacancy v WHERE v.moderationStatus IS NULL OR v.moderationStatus = resume.vakansya.entities.ModerationStatus.PENDING")
    long countPendingOrLegacy();

    List<Vacancy> findByCompany_Id(Long companyId);

    Optional<Vacancy> findByIdAndCompany_Owner_Id(Long id, Long ownerId);

    interface TopEmployerRow {
        String getEmployerName();
        long getCount();
    }

    @Query("""
            select c.name as employerName, count(v.id) as count
            from Vacancy v
            join v.company c
            group by c.id, c.name
            order by count(v.id) desc
            """)
    List<TopEmployerRow> findTopEmployers(Pageable pageable);
}
