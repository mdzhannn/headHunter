package resume.vakansya.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import resume.vakansya.entities.JobApplication;

import java.util.Optional;
import java.util.List;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    boolean existsByUser_IdAndVacancy_Id(Long userId, Long vacancyId);

    Optional<JobApplication> findByUser_IdAndVacancy_Id(Long userId, Long vacancyId);

    List<JobApplication> findAllByUser_IdOrderByCreatedAtDesc(Long userId);

    @Query("select count(a) from JobApplication a where lower(a.status) in :statuses")
    long countByStatuses(@Param("statuses") List<String> statuses);
}
