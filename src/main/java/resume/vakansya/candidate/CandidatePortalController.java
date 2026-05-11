package resume.vakansya.candidate;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import resume.vakansya.entities.ResumeDto;
import resume.vakansya.entities.VacancyDto;

import java.util.List;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/candidate")
@RequiredArgsConstructor
public class CandidatePortalController {

    private final CandidateResumeService candidateResumeService;
    private final CandidateVacancyService candidateVacancyService;
    private final CandidateApplyService candidateApplyService;

    @GetMapping("/resume")
    public ResumeDto getResume() {
        return candidateResumeService.getOrCreate(CandidateSecurity.requireUserId());
    }

    @PutMapping("/resume")
    public ResumeDto updateResume(@RequestBody ResumeDto dto) {
        return candidateResumeService.update(CandidateSecurity.requireUserId(), dto);
    }

    @GetMapping("/vacancies")
    public List<VacancyDto> vacancies(
            @RequestParam(required = false) Double salaryMin,
            @RequestParam(required = false) Double salaryMax,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String workType,
            @RequestParam(required = false) String experience,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q) {
        return candidateVacancyService.searchApproved(
                salaryMin, salaryMax, city, workType, experience, category, q);
    }

    @PostMapping("/vacancies/{vacancyId}/apply")
    public ResponseEntity<Void> apply(@PathVariable long vacancyId) {
        candidateApplyService.apply(CandidateSecurity.requireUserId(), vacancyId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/applications/my")
    public List<CandidateApplicationItemDto> myApplications() {
        return candidateApplyService.listMyApplications(CandidateSecurity.requireUserId());
    }
}
