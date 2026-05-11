package resume.vakansya.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import resume.vakansya.entities.BulkActionRequest;
import resume.vakansya.entities.RejectReasonRequest;
import resume.vakansya.entities.ResumeDto;
import resume.vakansya.services.ResumeService;

import java.util.LinkedHashSet;
import java.util.List;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/admin/resume")
@RequiredArgsConstructor
public class AdminResumeController {

    private final ResumeService resumeService;

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR')")
    public ResponseEntity<ResumeDto> approve(@PathVariable Long id) {
        return ResponseEntity.ok(resumeService.approveResume(id));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR')")
    public ResponseEntity<ResumeDto> reject(@PathVariable Long id, @RequestBody RejectReasonRequest body) {
        return ResponseEntity.ok(resumeService.rejectResume(id, body != null ? body.getReason() : null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        resumeService.deleteResume(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR')")
    public ResponseEntity<Void> bulk(@RequestBody BulkActionRequest body) {
        if (body == null || body.getIds() == null || body.getIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ids required");
        }
        if (body.getAction() == null || body.getAction().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "action required");
        }
        String action = body.getAction().trim().toUpperCase();
        List<Long> ids = new LinkedHashSet<>(body.getIds()).stream().toList();
        for (Long id : ids) {
            if (id == null) continue;
            switch (action) {
                case "APPROVE" -> resumeService.approveResume(id);
                case "REJECT" -> resumeService.rejectResume(id, "Bulk rejected by admin");
                case "DELETE" -> resumeService.deleteResume(id);
                default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "unsupported action");
            }
        }
        return ResponseEntity.ok().build();
    }
}
