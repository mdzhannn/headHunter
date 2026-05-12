package resume.vakansya.employer;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import resume.vakansya.entities.Company;
import resume.vakansya.entities.CompanyDto;
import resume.vakansya.entities.Conversation;
import resume.vakansya.entities.JobApplication;
import resume.vakansya.entities.ModerationStatus;
import resume.vakansya.entities.Resume;
import resume.vakansya.entities.ResumeDto;
import resume.vakansya.entities.User;
import resume.vakansya.entities.Vacancy;
import resume.vakansya.entities.VacancyDto;
import resume.vakansya.job.JobApplicationResumeSnapshotService;
import resume.vakansya.mappers.CompanyMapper;
import resume.vakansya.mappers.ResumeMapper;
import resume.vakansya.mappers.VacancyMapper;
import resume.vakansya.repositories.CompanyRepository;
import resume.vakansya.repositories.ConversationRepository;
import resume.vakansya.repositories.JobApplicationRepository;
import resume.vakansya.repositories.ResumeRepository;
import resume.vakansya.repositories.UserRepository;
import resume.vakansya.repositories.VacancyRepository;
import resume.vakansya.services.AdminNotificationService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployerPortalService {

    private final CompanyRepository companyRepository;
    private final VacancyRepository vacancyRepository;
    private final ResumeRepository resumeRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final CompanyMapper companyMapper;
    private final VacancyMapper vacancyMapper;
    private final ResumeMapper resumeMapper;
    private final JobApplicationResumeSnapshotService resumeSnapshotService;
    private final AdminNotificationService adminNotificationService;

    @Transactional(readOnly = true)
    public CompanyDto getMyCompany(long userId) {
        requireEmployerAccess(userId);
        return companyRepository.findByOwner_Id(userId)
                .map(companyMapper::mapToDto)
                .orElse(null);
    }

    @Transactional
    public CompanyDto upsertMyCompany(long userId, CompanyDto body) {
        requireEmployerAccess(userId);
        if (body == null || body.getName() == null || body.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "company name required");
        }
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "user not found"));

        Company company = companyRepository.findByOwner_Id(userId).orElseGet(Company::new);
        company.setOwner(owner);
        company.setName(body.getName().trim());
        company.setInn(body.getInn());
        company.setContacts(body.getContacts());
        company.setDocuments(body.getDocuments());
        if (company.getModerationStatus() == null) {
            company.setModerationStatus(ModerationStatus.PENDING);
        }
        return companyMapper.mapToDto(companyRepository.save(company));
    }

    @Transactional(readOnly = true)
    public List<VacancyDto> listMyVacancies(long userId) {
        requireEmployerAccess(userId);
        Company company = companyRepository.findByOwner_Id(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "company profile required"));
        return vacancyMapper.mapToDtoList(vacancyRepository.findByCompany_Id(company.getId()));
    }

    /**
     * Все резюме кандидатов для работодателя, кроме отклонённых модерацией.
     */
    @Transactional(readOnly = true)
    public List<ResumeDto> listResumesForEmployer(long userId) {
        requireEmployerAccess(userId);
        List<Resume> list = resumeRepository.findAllForEmployerCatalog();
        return resumeMapper.mapToDtoList(list);
    }

    @Transactional(readOnly = true)
    public List<EmployerApplicationItemDto> listApplicationsForEmployer(long userId) {
        requireEmployerAccess(userId);
        List<JobApplication> apps = jobApplicationRepository.findForCompanyOwner(userId);
        if (apps.isEmpty()) {
            return List.of();
        }

        // Загружаем conversation для всех откликов одним запросом
        List<Long> appIds = apps.stream().map(JobApplication::getId).toList();
        java.util.Map<Long, Long> convByApp = conversationRepository.findAllByApplicationIds(appIds)
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        c -> c.getApplication().getId(),
                        Conversation::getId,
                        (a, b) -> a));

        return apps.stream()
                .map(app -> new EmployerApplicationItemDto(
                        app.getId(),
                        app.getVacancy() != null ? app.getVacancy().getId() : null,
                        app.getVacancy() != null ? app.getVacancy().getJobTitle() : null,
                        app.getCreatedAt(),
                        app.getStatus(),
                        resumeSnapshotService.resumeAtApply(app),
                        convByApp.get(app.getId())))
                .toList();
    }

    /**
     * Создаёт беседы для откликов на вакансии работодателя, у которых их ещё нет.
     * Нужно для откликов, созданных до исправления ConversationService.
     */
    @Transactional
    public int repairConversations(long userId) {
        requireEmployerAccess(userId);
        List<JobApplication> apps = jobApplicationRepository.findForCompanyOwner(userId);
        List<Long> appIds = apps.stream().map(JobApplication::getId).toList();
        java.util.Set<Long> existingAppIds = conversationRepository.findAllByApplicationIds(appIds)
                .stream()
                .map(c -> c.getApplication().getId())
                .collect(java.util.stream.Collectors.toSet());

        int count = 0;
        for (JobApplication app : apps) {
            if (existingAppIds.contains(app.getId())) continue;
            Vacancy v = app.getVacancy();
            User employer = v.getUser();
            if (employer == null && v.getCompany() != null && v.getCompany().getOwner() != null) {
                employer = v.getCompany().getOwner();
            }
            if (employer == null) continue;
            Conversation c = new Conversation();
            c.setApplication(app);
            c.setCandidateUserId(app.getUser().getId());
            c.setEmployerUserId(employer.getId());
            conversationRepository.save(c);
            count++;
        }
        return count;
    }

    @Transactional
    public VacancyDto createMyVacancy(long userId, VacancyDto body) {
        requireEmployerAccess(userId);
        if (body == null || body.getJobTitle() == null || body.getJobTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "job title required");
        }
        Company company = companyRepository.findByOwner_Id(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "company profile required"));

        Vacancy vacancy = vacancyMapper.mapToEntity(body);
        vacancy.setCompany(company);
        vacancy.setUser(company.getOwner());
        if (vacancy.getAboutCompany() == null || vacancy.getAboutCompany().isBlank()) {
            vacancy.setAboutCompany(company.getName());
        }
        vacancy.setModerationStatus(ModerationStatus.PENDING);
        vacancy.setRejectionReason(null);
        Vacancy saved = vacancyRepository.save(vacancy);
        adminNotificationService.vacancySubmittedForModeration(saved.getId());
        return vacancyMapper.mapToDto(saved);
    }

    @Transactional
    public VacancyDto updateMyVacancy(long userId, long vacancyId, VacancyDto body) {
        requireEmployerAccess(userId);
        Vacancy vacancy = vacancyRepository.findByIdAndCompany_Owner_Id(vacancyId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "vacancy not found"));
        vacancyMapper.updateVacancyFromDto(body, vacancy);
        vacancy.setModerationStatus(ModerationStatus.PENDING);
        vacancy.setRejectionReason(null);
        Vacancy saved = vacancyRepository.save(vacancy);
        adminNotificationService.vacancySubmittedForModeration(saved.getId());
        return vacancyMapper.mapToDto(saved);
    }

    @Transactional
    public void deleteMyVacancy(long userId, long vacancyId) {
        requireEmployerAccess(userId);
        Vacancy vacancy = vacancyRepository.findByIdAndCompany_Owner_Id(vacancyId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "vacancy not found"));
        vacancyRepository.delete(vacancy);
    }

    private void requireEmployerAccess(long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "user not found"));
        String role = user.getRole() != null ? user.getRole().getName() : "";
        if (!"EMPLOYER".equals(role) && !"BOTH".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "employer role required");
        }
    }
}
