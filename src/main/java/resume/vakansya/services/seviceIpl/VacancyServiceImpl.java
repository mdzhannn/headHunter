package resume.vakansya.services.seviceIpl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import resume.vakansya.entities.ModerationStatus;
import resume.vakansya.entities.Vacancy;
import resume.vakansya.entities.VacancyDto;
import resume.vakansya.mappers.VacancyMapper;
import resume.vakansya.repositories.CompanyRepository;
import resume.vakansya.repositories.VacancyRepository;
import resume.vakansya.services.VacancyService;

import java.util.List;

@Service
public class VacancyServiceImpl implements VacancyService {

    private final VacancyRepository vacancyRepository;
    private final CompanyRepository companyRepository;
    private final VacancyMapper vacancyMapper;

    public VacancyServiceImpl(VacancyRepository vacancyRepository,
            CompanyRepository companyRepository,
            VacancyMapper vacancyMapper) {
        this.vacancyRepository = vacancyRepository;
        this.companyRepository = companyRepository;
        this.vacancyMapper = vacancyMapper;
    }

    @Override
    public List<VacancyDto> getALlVacancy() {
        return vacancyMapper.mapToDtoList(vacancyRepository.findAll());
    }

    @Override
    public VacancyDto addVacancy(VacancyDto addVacancy) {
        Vacancy vacancy = vacancyMapper.mapToEntity(addVacancy);
        if (addVacancy.getCompanyId() != null) {
            companyRepository.findById(addVacancy.getCompanyId()).ifPresent(vacancy::setCompany);
        }
        Vacancy savedVacancy = vacancyRepository.save(vacancy);
        return vacancyMapper.mapToDto(savedVacancy);
    }

    @Override
    public VacancyDto getVacancy(Long id) {
        return vacancyMapper.mapToDto(vacancyRepository.findAllById(id));
    }

    @Override
    public VacancyDto updateVacancy(VacancyDto updVacancy) {
        Vacancy existing = vacancyRepository.findById(updVacancy.getId())
                .orElseThrow(() -> new RuntimeException("Vacancy not found with id: " + updVacancy.getId()));
        vacancyMapper.updateVacancyFromDto(updVacancy, existing);
        if (updVacancy.getCompanyId() != null) {
            companyRepository.findById(updVacancy.getCompanyId()).ifPresent(existing::setCompany);
        }
        return vacancyMapper.mapToDto(vacancyRepository.save(existing));
    }

    @Override
    public void deleteVacancy(Long id) {
        vacancyRepository.deleteById(id);
    }

    @Override
    public List<VacancyDto> getPendingVacancies() {
        return vacancyMapper.mapToDtoList(vacancyRepository.findPendingOrLegacy());
    }

    @Override
    @Transactional
    public VacancyDto approveVacancy(Long id) {
        Vacancy vacancy = vacancyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vacancy not found with id: " + id));
        vacancy.setModerationStatus(ModerationStatus.APPROVED);
        vacancy.setRejectionReason(null);
        return vacancyMapper.mapToDto(vacancyRepository.save(vacancy));
    }

    @Override
    @Transactional
    public VacancyDto rejectVacancy(Long id, String reason) {
        Vacancy vacancy = vacancyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vacancy not found with id: " + id));
        vacancy.setModerationStatus(ModerationStatus.REJECTED);
        vacancy.setRejectionReason(reason != null ? reason : "");
        return vacancyMapper.mapToDto(vacancyRepository.save(vacancy));
    }
}
