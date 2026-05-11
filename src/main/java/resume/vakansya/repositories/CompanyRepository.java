package resume.vakansya.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import resume.vakansya.entities.Company;
import resume.vakansya.entities.ModerationStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    List<Company> findByModerationStatus(ModerationStatus moderationStatus);

    long countByModerationStatus(ModerationStatus moderationStatus);

    Optional<Company> findByOwner_Id(Long ownerId);
}
