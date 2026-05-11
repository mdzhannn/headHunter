package resume.vakansya.employer;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import resume.vakansya.entities.Company;
import resume.vakansya.entities.CompanyDto;
import resume.vakansya.entities.ModerationStatus;
import resume.vakansya.entities.User;
import resume.vakansya.entities.Vacancy;
import resume.vakansya.entities.VacancyDto;
import resume.vakansya.mappers.CompanyMapper;
import resume.vakansya.mappers.VacancyMapper;
import resume.vakansya.repositories.CompanyRepository;
import resume.vakansya.repositories.UserRepository;
import resume.vakansya.repositories.VacancyRepository;
import resume.vakansya.services.AdminNotificationService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployerPortalService {

    private final CompanyRepository companyRepository;
    private final VacancyRepository vacancyRepository;
    private final UserRepository userRepository;
    private final CompanyMapper companyMapper;
    private final VacancyMapper vacancyMapper;
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
