package resume.vakansya.services.seviceIpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import resume.vakansya.entities.Vacancy;
import resume.vakansya.entities.VacancyDto;
import resume.vakansya.mappers.VacancyMapper;
import resume.vakansya.repositories.VacancyRepository;
import resume.vakansya.services.VacancyService;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VacancyServiceImpl implements VacancyService {
    @Autowired
    private final  VacancyRepository vacancyRepository;
    @Autowired
    private final VacancyMapper vacancyMapper;
    @Override
    public List<VacancyDto> getALlVacancy() {
        return vacancyMapper.mapToDtoList(vacancyRepository.findAll());
    }

    @Override
    public VacancyDto addVacancy(VacancyDto addVacancy) {
        Vacancy vacancy = vacancyMapper.mapToEntity(addVacancy);
        Vacancy savedVacancy = vacancyRepository.save(vacancy);
        return vacancyMapper.mapToDto(savedVacancy);
    }

    @Override
    public VacancyDto getVacancy(Long id) {
        return vacancyMapper.mapToDto(vacancyRepository.findAllById(id));
    }

    @Override
    public VacancyDto updateVacancy(VacancyDto updVacancy) {
        Vacancy vacancy = vacancyMapper.mapToEntity(updVacancy);
        return vacancyMapper.mapToDto(vacancyRepository.save(vacancy));
    }

    @Override
    public void deleteVacancy(Long id) {
        vacancyRepository.deleteById(id);
    }
    @Autowired
    public VacancyServiceImpl(VacancyRepository vacancyRepository, VacancyMapper vacancyMapper) {
        this.vacancyRepository = vacancyRepository;
        this.vacancyMapper = vacancyMapper;
    }

    @Override
    public void verifyVacancy(Long vacancyId) {
        Vacancy vacancy = vacancyRepository.findById(vacancyId)
                .orElseThrow(() -> new RuntimeException("Vacancy not found with id: " + vacancyId));
        vacancy.setVerify(true);
        vacancyRepository.save(vacancy);
    }

    @Override
    public List<VacancyDto> getPendingVacancies() {
        List<Vacancy> pendingVacancies = vacancyRepository.findByIsVerifyFalse();
        return pendingVacancies.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private VacancyDto convertToDto(Vacancy vacancy) {
        VacancyDto vacancyDto = new VacancyDto();
        vacancyDto.setId(vacancy.getId());
        vacancyDto.setVerify(vacancy.isVerify());
        // Заполнение остальных полей DTO
        return vacancyDto;
    }
}
