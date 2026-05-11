package resume.vakansya.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import resume.vakansya.entities.VacancyDto;
import resume.vakansya.services.VacancyService;

import java.util.List;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/vacancy")
public class VacancyController {
    @Autowired
    private VacancyService vacancyService;
    @GetMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR','SUPPORT')")
    public List<VacancyDto> getAllVacancy(){
        return vacancyService.getALlVacancy();
    }
    @PostMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR')")
    public VacancyDto addVacancy(@RequestBody VacancyDto vacancyDto){
        return vacancyService.addVacancy(vacancyDto);
    }
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR','SUPPORT')")
    public VacancyDto getVacancy(@PathVariable("id")Long id){
        return vacancyService.getVacancy(id);
    }
    @PutMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR')")
    public VacancyDto updateVacancy(@RequestBody VacancyDto updVacancy){
        return vacancyService.updateVacancy(updVacancy);
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR')")
    public void deleteVacancy(@PathVariable("id")Long id){
        vacancyService.deleteVacancy(id);
    }
    @GetMapping("/pending")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR','SUPPORT')")
    public ResponseEntity<List<VacancyDto>> getPendingVacancies() {
        List<VacancyDto> pendingVacancies = vacancyService.getPendingVacancies();
        return ResponseEntity.ok(pendingVacancies);
    }
}
