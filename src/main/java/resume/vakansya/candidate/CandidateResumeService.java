package resume.vakansya.candidate;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import resume.vakansya.entities.ModerationStatus;
import resume.vakansya.entities.Resume;
import resume.vakansya.entities.ResumeDto;
import resume.vakansya.entities.User;
import resume.vakansya.mappers.ResumeMapper;
import resume.vakansya.repositories.ResumeRepository;
import resume.vakansya.repositories.UserRepository;

@Service
@RequiredArgsConstructor
public class CandidateResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final ResumeMapper resumeMapper;

    @Transactional
    public ResumeDto getOrCreate(long userId) {
        requireCandidateAccess(userId);
        return resumeMapper.mapToDto(resumeRepository.findByUser_Id(userId)
                .orElseGet(() -> createBlank(userId)));
    }

    private Resume createBlank(long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found: " + userId));
        Resume r = new Resume();
        r.setUser(user);
        r.setPhone(user.getPhone());
        r.setModerationStatus(ModerationStatus.PENDING);
        return resumeRepository.save(r);
    }

    @Transactional
    public ResumeDto update(long userId, ResumeDto dto) {
        requireCandidateAccess(userId);
        Resume resume = resumeRepository.findByUser_Id(userId).orElseGet(() -> createBlank(userId));
        if (dto.getId() != null && !dto.getId().equals(resume.getId())) {
            throw new IllegalArgumentException("Resume id mismatch");
        }
        dto.setId(resume.getId());
        dto.setModerationStatus(null);
        dto.setRejectionReason(null);
        dto.setCreateDate(null);
        resumeMapper.updateResumeFromDto(dto, resume);
        return resumeMapper.mapToDto(resumeRepository.save(resume));
    }

    private void requireCandidateAccess(long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found: " + userId));
        String role = user.getRole() != null ? user.getRole().getName() : "";
        if (!"CANDIDATE".equals(role) && !"BOTH".equals(role)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "candidate role required");
        }
    }
}
