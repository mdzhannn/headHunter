package resume.vakansya.employer;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import resume.vakansya.candidate.CandidateSecurity;
import resume.vakansya.entities.CompanyDto;
import resume.vakansya.entities.ResumeDto;
import resume.vakansya.entities.VacancyDto;

import java.util.List;

@RestController
@RequestMapping("/employer")
@RequiredArgsConstructor
public class EmployerPortalController {

    private final EmployerPortalService employerPortalService;

    @GetMapping("/company")
    public CompanyDto getMyCompany() {
        return employerPortalService.getMyCompany(CandidateSecurity.requireUserId());
    }

    @PutMapping("/company")
    public CompanyDto upsertMyCompany(@RequestBody CompanyDto body) {
        return employerPortalService.upsertMyCompany(CandidateSecurity.requireUserId(), body);
    }

    @GetMapping("/vacancies")
    public List<VacancyDto> myVacancies() {
        return employerPortalService.listMyVacancies(CandidateSecurity.requireUserId());
    }

    @GetMapping("/resumes")
    public List<ResumeDto> employerResumes() {
        return employerPortalService.listResumesForEmployer(CandidateSecurity.requireUserId());
    }

    @GetMapping("/applications")
    public List<EmployerApplicationItemDto> employerApplications() {
        return employerPortalService.listApplicationsForEmployer(CandidateSecurity.requireUserId());
    }

    @PostMapping("/applications/repair-conversations")
    public java.util.Map<String, Object> repairConversations() {
        int created = employerPortalService.repairConversations(CandidateSecurity.requireUserId());
        return java.util.Map.of("created", created, "message",
                created > 0 ? "Создано бесед: " + created : "Все беседы уже существуют");
    }

    @PostMapping("/vacancies")
    public VacancyDto createVacancy(@RequestBody VacancyDto body) {
        return employerPortalService.createMyVacancy(CandidateSecurity.requireUserId(), body);
    }

    @PutMapping("/vacancies/{id}")
    public VacancyDto updateVacancy(@PathVariable long id, @RequestBody VacancyDto body) {
        return employerPortalService.updateMyVacancy(CandidateSecurity.requireUserId(), id, body);
    }

    @DeleteMapping("/vacancies/{id}")
    public void deleteVacancy(@PathVariable long id) {
        employerPortalService.deleteMyVacancy(CandidateSecurity.requireUserId(), id);
    }
}
