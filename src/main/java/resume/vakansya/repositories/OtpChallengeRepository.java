package resume.vakansya.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import resume.vakansya.entities.OtpChallenge;

import java.time.LocalDateTime;

@Repository
public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, Long> {

    long countByPhoneAndCreatedAtAfter(String phone, LocalDateTime after);

    OtpChallenge findFirstByPhoneOrderByCreatedAtDesc(String phone);

    void deleteByPhone(String phone);
}
