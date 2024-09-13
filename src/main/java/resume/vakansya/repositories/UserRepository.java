package resume.vakansya.repositories;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import resume.vakansya.entities.User;

@Repository
@Transactional
public interface UserRepository extends JpaRepository<User,Long> {
    User findAllById(Long id);
}
