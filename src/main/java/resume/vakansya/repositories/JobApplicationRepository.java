package resume.vakansya.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import resume.vakansya.entities.JobApplication;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    boolean existsByUser_IdAndVacancy_Id(Long userId, Long vacancyId);

    Optional<JobApplication> findByUser_IdAndVacancy_Id(Long userId, Long vacancyId);

    List<JobApplication> findAllByUser_IdOrderByCreatedAtDesc(Long userId);

    @Query("""
            SELECT DISTINCT a FROM JobApplication a
            JOIN FETCH a.vacancy v
            LEFT JOIN FETCH v.company c
            LEFT JOIN FETCH a.resume r
            LEFT JOIN FETCH a.user u
            WHERE (c IS NOT NULL AND c.owner.id = :ownerId)
               OR (v.user IS NOT NULL AND v.user.id = :ownerId)
            ORDER BY a.createdAt DESC
            """)
    List<JobApplication> findForCompanyOwner(@Param("ownerId") long ownerId);

    @Query("select count(a) from JobApplication a where lower(a.status) in :statuses")
    long countByStatuses(@Param("statuses") List<String> statuses);
}
