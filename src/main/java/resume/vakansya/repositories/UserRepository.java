package resume.vakansya.repositories;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import resume.vakansya.entities.User;

import java.time.LocalDateTime;
import java.util.List;

@Repository
@Transactional
public interface UserRepository extends JpaRepository<User,Long> {
    User findAllById(Long id);

    java.util.Optional<User> findByPhone(String phone);

    List<User> findByCreateDateGreaterThanEqual(LocalDateTime from);
}
