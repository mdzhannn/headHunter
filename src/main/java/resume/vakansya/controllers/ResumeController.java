package resume.vakansya.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import resume.vakansya.entities.ResumeDto;
import resume.vakansya.services.ResumeService;

import java.util.List;

@RestController
@RequestMapping("/resume")
public class ResumeController {
    @Autowired
    private ResumeService resumeService;
    @GetMapping
    public List<ResumeDto> getAllResume(){
        return resumeService.getAllResume();
    }
    @PostMapping
    public ResumeDto addResume(@RequestBody ResumeDto resumeDto){
        return resumeService.addResume(resumeDto);
    }
    @GetMapping("/{id}")
    public ResumeDto getResume(@PathVariable("id")Long id){
        return resumeService.getResume(id);
    }
    @PutMapping
    public ResumeDto updResume(@RequestBody ResumeDto resumeDto){
        return resumeService.updateResume(resumeDto);
    }
    @DeleteMapping("/{id}")
    public void deleteResume(@PathVariable("id")Long id){
        resumeService.deleteResume(id);
    }
    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }
    @PostMapping("/{id}/files")
    public void uploadFiles(@PathVariable Long id, @RequestParam("files") List<MultipartFile> files) {
        resumeService.addFilesToResume(id, files);
    }
    @PostMapping("/{resumeId}/verify")
    public ResponseEntity<?> verifyResume(@PathVariable Long resumeId) {
        resumeService.verifyResume(resumeId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/pending")
    public ResponseEntity<List<ResumeDto>> getPendingResumes() {
        List<ResumeDto> pendingResumes = resumeService.getPendingResumes();
        return ResponseEntity.ok(pendingResumes);
    }


}
