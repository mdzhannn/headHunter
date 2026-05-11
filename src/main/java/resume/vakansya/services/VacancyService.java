package resume.vakansya.services;

import resume.vakansya.entities.VacancyDto;

import java.util.List;

public interface VacancyService {
    List<VacancyDto> getALlVacancy();
    VacancyDto addVacancy(VacancyDto addVacancy);
    VacancyDto getVacancy(Long id);
    VacancyDto updateVacancy(VacancyDto updVacancy);
    void deleteVacancy(Long id);

    List<VacancyDto> getPendingVacancies();

    VacancyDto approveVacancy(Long id);

    VacancyDto rejectVacancy(Long id, String reason);
}
