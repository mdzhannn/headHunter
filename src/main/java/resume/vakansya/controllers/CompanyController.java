package resume.vakansya.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import resume.vakansya.entities.CompanyDto;
import resume.vakansya.entities.ModerationStatus;
import resume.vakansya.entities.RejectReasonRequest;
import resume.vakansya.services.CompanyService;

import java.util.List;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/admin/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR','SUPPORT')")
    public ResponseEntity<List<CompanyDto>> list(@RequestParam(required = false) String status) {
        ModerationStatus st = null;
        if (status != null && !status.isBlank()) {
            try {
                st = ModerationStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().build();
            }
        }
        return ResponseEntity.ok(companyService.list(st));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR','SUPPORT')")
    public ResponseEntity<CompanyDto> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(companyService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR')")
    public ResponseEntity<CompanyDto> approve(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(companyService.approve(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR')")
    public ResponseEntity<CompanyDto> reject(@PathVariable Long id,
            @RequestBody RejectReasonRequest body) {
        try {
            return ResponseEntity.ok(companyService.reject(id, body != null ? body.getReason() : null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            companyService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
