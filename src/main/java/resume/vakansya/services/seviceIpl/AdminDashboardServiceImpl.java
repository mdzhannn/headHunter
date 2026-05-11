package resume.vakansya.services.seviceIpl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import resume.vakansya.entities.AdminDashboardDto;
import resume.vakansya.entities.ModerationStatus;
import resume.vakansya.repositories.CompanyRepository;
import resume.vakansya.repositories.JobApplicationRepository;
import resume.vakansya.repositories.ResumeRepository;
import resume.vakansya.repositories.UserRepository;
import resume.vakansya.repositories.VacancyRepository;
import resume.vakansya.services.AdminDashboardService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final ResumeRepository resumeRepository;
    private final VacancyRepository vacancyRepository;
    private final JobApplicationRepository jobApplicationRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardDto getStats() {
        long totalUsers = userRepository.count();
        long totalCompanies = companyRepository.count();
        long totalResumes = resumeRepository.count();
        long totalVacancies = vacancyRepository.count();
        long pendingCompanies = companyRepository.countByModerationStatus(ModerationStatus.PENDING);
        long pendingResumes = resumeRepository.countPendingOrLegacy();
        long pendingVacancies = vacancyRepository.countPendingOrLegacy();
        List<AdminDashboardDto.RegistrationByDayDto> registrationsByDay = buildRegistrationsByDay();
        AdminDashboardDto.ApplicationFunnelDto applicationFunnel = buildApplicationFunnel();
        List<AdminDashboardDto.TopEmployerDto> topEmployers = buildTopEmployers();
        return new AdminDashboardDto(
                totalUsers,
                totalCompanies,
                totalResumes,
                totalVacancies,
                pendingCompanies,
                pendingResumes,
                pendingVacancies,
                registrationsByDay,
                applicationFunnel,
                topEmployers);
    }

    private List<AdminDashboardDto.RegistrationByDayDto> buildRegistrationsByDay() {
        LocalDate today = LocalDate.now();
        LocalDate fromDay = today.minusDays(29);
        LocalDateTime fromDateTime = fromDay.atStartOfDay();
        Map<LocalDate, Long> byDate = new HashMap<>();
        userRepository.findByCreateDateGreaterThanEqual(fromDateTime).forEach(user -> {
            if (user.getCreateDate() != null) {
                LocalDate day = user.getCreateDate().toLocalDate();
                byDate.put(day, byDate.getOrDefault(day, 0L) + 1L);
            }
        });
        return fromDay.datesUntil(today.plusDays(1))
                .map(day -> new AdminDashboardDto.RegistrationByDayDto(day.toString(), byDate.getOrDefault(day, 0L)))
                .toList();
    }

    private AdminDashboardDto.ApplicationFunnelDto buildApplicationFunnel() {
        long total = jobApplicationRepository.count();
        long accepted = jobApplicationRepository.countByStatuses(List.of("accepted", "hired", "approved"));
        long rejected = jobApplicationRepository.countByStatuses(List.of("rejected", "declined"));
        long viewedOrReviewed = jobApplicationRepository.countByStatuses(List.of("viewed", "reviewed"));
        long reviewed = Math.min(total, viewedOrReviewed + accepted + rejected);
        return new AdminDashboardDto.ApplicationFunnelDto(total, reviewed, accepted, rejected);
    }

    private List<AdminDashboardDto.TopEmployerDto> buildTopEmployers() {
        return vacancyRepository.findTopEmployers(PageRequest.of(0, 5)).stream()
                .map(row -> new AdminDashboardDto.TopEmployerDto(row.getEmployerName(), row.getCount()))
                .toList();
    }
}
