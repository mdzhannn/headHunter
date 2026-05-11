package resume.vakansya.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import resume.vakansya.entities.ResumeDto;
import resume.vakansya.services.ResumeService;

import java.util.List;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/resume")
public class ResumeController {
    @Autowired
    private ResumeService resumeService;
    @GetMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR','SUPPORT')")
    public List<ResumeDto> getAllResume(){
        return resumeService.getAllResume();
    }
    @PostMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR')")
    public ResumeDto addResume(@RequestBody ResumeDto resumeDto){
        return resumeService.addResume(resumeDto);
    }
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR','SUPPORT')")
    public ResumeDto getResume(@PathVariable("id")Long id){
        return resumeService.getResume(id);
    }
    @PutMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR')")
    public ResumeDto updResume(@RequestBody ResumeDto resumeDto){
        return resumeService.updateResume(resumeDto);
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR')")
    public void deleteResume(@PathVariable("id")Long id){
        resumeService.deleteResume(id);
    }
    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }
    @PostMapping("/{id}/files")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR')")
    public void uploadFiles(@PathVariable Long id, @RequestParam("files") List<MultipartFile> files) {
        resumeService.addFilesToResume(id, files);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR','SUPPORT')")
    public ResponseEntity<List<ResumeDto>> getPendingResumes() {
        List<ResumeDto> pendingResumes = resumeService.getPendingResumes();
        return ResponseEntity.ok(pendingResumes);
    }


}
