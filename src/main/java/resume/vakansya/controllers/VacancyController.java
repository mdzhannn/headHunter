package resume.vakansya.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import resume.vakansya.entities.VacancyDto;
import resume.vakansya.services.VacancyService;

import java.util.List;

@RestController
@RequestMapping("/vacancy")
public class VacancyController {
    @Autowired
    private VacancyService vacancyService;
    @GetMapping
    public List<VacancyDto> getAllVacancy(){
        return vacancyService.getALlVacancy();
    }
    @PostMapping
    public VacancyDto addVacancy(VacancyDto vacancyDto){
        return vacancyService.addVacancy(vacancyDto);
    }
    @GetMapping("/{id}")
    public VacancyDto getVacancy(@PathVariable("id")Long id){
        return vacancyService.getVacancy(id);
    }
    @PutMapping
    public VacancyDto updateVacancy(VacancyDto updVacancy){
        return vacancyService.updateVacancy(updVacancy);
    }
    @DeleteMapping("/{id}")
    public void deleteVacancy(@PathVariable("id")Long id){
        vacancyService.deleteVacancy(id);
    }
    @PostMapping("/{vacancyId}/verify")
    public ResponseEntity<?> verifyVacancy(@PathVariable Long vacancyId) {
        vacancyService.verifyVacancy(vacancyId);
        return ResponseEntity.ok().build();
    }
    @GetMapping("/pending")
    public ResponseEntity<List<VacancyDto>> getPendingVacancies() {
        List<VacancyDto> pendingVacancies = vacancyService.getPendingVacancies();
        return ResponseEntity.ok(pendingVacancies);
    }
}
