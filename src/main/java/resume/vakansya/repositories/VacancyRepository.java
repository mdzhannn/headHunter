package resume.vakansya.repositories;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import resume.vakansya.entities.Vacancy;

import java.util.List;

@Repository
@Transactional
public interface VacancyRepository extends JpaRepository<Vacancy,Long> {
    Vacancy findAllById(Long id);
    List<Vacancy> findByIsVerifyFalse();
}
