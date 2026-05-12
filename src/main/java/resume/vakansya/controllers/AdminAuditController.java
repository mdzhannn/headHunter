package resume.vakansya.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import resume.vakansya.audit.AuditLogDto;
import resume.vakansya.entities.AuditLog;
import resume.vakansya.repositories.AuditLogRepository;

import java.time.LocalDateTime;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/admin/audit")
@RequiredArgsConstructor
public class AdminAuditController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public Page<AuditLogDto> list(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String adminEmail,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @PageableDefault(size = 20, sort = "changedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Specification<AuditLog> spec = buildSpec(blankToNull(entityType), blankToNull(adminEmail), from, to);
        return auditLogRepository.findAll(spec, pageable).map(this::toDto);
    }

    private Specification<AuditLog> buildSpec(String entityType, String adminEmail,
                                               LocalDateTime from, LocalDateTime to) {
        return (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (entityType != null) {
                predicates.add(cb.equal(cb.lower(root.get("entityType")), entityType.toLowerCase()));
            }
            if (adminEmail != null) {
                predicates.add(cb.like(cb.lower(root.get("adminEmail")),
                        "%" + adminEmail.toLowerCase() + "%"));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("changedAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("changedAt"), to));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
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
