package resume.vakansya.candidate;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import resume.vakansya.entities.JobApplication;
import resume.vakansya.entities.ModerationStatus;
import resume.vakansya.entities.Resume;
import resume.vakansya.entities.User;
import resume.vakansya.entities.Vacancy;
import resume.vakansya.job.JobApplicationResumeSnapshotService;
import resume.vakansya.repositories.JobApplicationRepository;
import resume.vakansya.repositories.ResumeRepository;
import resume.vakansya.repositories.UserRepository;
import resume.vakansya.repositories.VacancyRepository;
import resume.vakansya.chat.ConversationService;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CandidateApplyService {

    private final VacancyRepository vacancyRepository;
    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final ConversationService conversationService;
    private final JobApplicationResumeSnapshotService resumeSnapshotService;

    @Transactional
    public void apply(long userId, long vacancyId) {
        requireCandidateAccess(userId);
        Vacancy vacancy = vacancyRepository.findById(vacancyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vacancy not found"));
        if (vacancy.getModerationStatus() != ModerationStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vacancy is not open");
        }
        if (jobApplicationRepository.existsByUser_IdAndVacancy_Id(userId, vacancyId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already applied");
        }
        Resume resume = resumeRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume required"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        JobApplication app = new JobApplication();
        app.setUser(user);
        app.setVacancy(vacancy);
        app.setResume(resume);
        app.setStatus("SENT");
        resumeSnapshotService.attachSnapshot(app, resume);
        jobApplicationRepository.save(app);
        conversationService.ensureForApplication(app);
    }

    @Transactional(readOnly = true)
    public List<CandidateApplicationItemDto> listMyApplications(long userId) {
        requireCandidateAccess(userId);
        return jobApplicationRepository.findAllByUser_IdOrderByCreatedAtDesc(userId).stream()
                .map(app -> new CandidateApplicationItemDto(
                        app.getId(),
                        app.getVacancy() != null ? app.getVacancy().getId() : null,
                        app.getVacancy() != null ? app.getVacancy().getJobTitle() : null,
                        resolveCompanyDisplayName(app),
                        app.getCreatedAt(),
                        app.getStatus(),
                        resumeSnapshotService.resumeAtApply(app)))
                .toList();
    }

    private static String resolveCompanyDisplayName(JobApplication app) {
        Vacancy v = app.getVacancy();
        if (v == null) {
            return null;
        }
        if (v.getCompany() != null && v.getCompany().getName() != null && !v.getCompany().getName().isBlank()) {
            return v.getCompany().getName();
        }
        return v.getAboutCompany();
    }

    private void requireCandidateAccess(long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        String role = user.getRole() != null ? user.getRole().getName() : "";
        if (!"CANDIDATE".equals(role) && !"BOTH".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "candidate role required");
        }
    }
}
