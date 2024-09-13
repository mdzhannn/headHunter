package resume.vakansya.repositories;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import resume.vakansya.entities.Resume;

import java.util.List;

@Repository
@Transactional
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    Resume findAllById(Long id);
    List<Resume> findByIsVerifyFalse();
}
