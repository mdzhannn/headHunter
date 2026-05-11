package resume.vakansya.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import resume.vakansya.audit.AuditLogDto;
import resume.vakansya.entities.AuditLog;
import resume.vakansya.repositories.AuditLogRepository;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/admin/audit")
@RequiredArgsConstructor
public class AdminAuditController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR','SUPPORT')")
    public Page<AuditLogDto> list(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String adminEmail,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @PageableDefault(size = 20, sort = "changedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return auditLogRepository.search(blankToNull(entityType), blankToNull(adminEmail), from, to, pageable)
                .map(this::toDto);
    }

    private AuditLogDto toDto(AuditLog entity) {
        return new AuditLogDto(
                entity.getId(),
                entity.getAdminEmail(),
                entity.getAction(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getOldValue(),
                entity.getChangedAt()
        );
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
