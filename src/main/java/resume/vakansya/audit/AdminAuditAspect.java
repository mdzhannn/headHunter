package resume.vakansya.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import resume.vakansya.entities.AuditLog;
import resume.vakansya.entities.Company;
import resume.vakansya.entities.Resume;
import resume.vakansya.entities.User;
import resume.vakansya.entities.UserDto;
import resume.vakansya.entities.Vacancy;
import resume.vakansya.repositories.AuditLogRepository;
import resume.vakansya.repositories.CompanyRepository;
import resume.vakansya.repositories.ResumeRepository;
import resume.vakansya.repositories.UserRepository;
import resume.vakansya.repositories.VacancyRepository;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Aspect
@Component
@RequiredArgsConstructor
public class AdminAuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final VacancyRepository vacancyRepository;
    private final CompanyRepository companyRepository;
    private final ObjectMapper objectMapper;

    @Around("execution(* resume.vakansya.controllers.Admin*Controller.*(..)) || execution(* resume.vakansya.controllers.CompanyController.*(..)) || execution(* resume.vakansya.controllers.UserController.*(..))")
    public Object captureAdminChanges(ProceedingJoinPoint joinPoint) throws Throwable {
        Method method = ((MethodSignature) joinPoint.getSignature()).getMethod();
        if (!isMutatingMethod(method)) {
            return joinPoint.proceed();
        }

        AuditContext ctx = resolveContext(joinPoint);
        Object result = joinPoint.proceed();

        Long finalEntityId = ctx.entityId != null ? ctx.entityId : tryResolveIdFromResult(result);
        AuditLog log = new AuditLog();
        log.setAdminEmail(resolveAdminEmail());
        log.setAction(method.getName().toUpperCase());
        log.setEntityType(ctx.entityType);
        log.setEntityId(finalEntityId);
        log.setOldValue(ctx.oldValueJson);
        log.setChangedAt(LocalDateTime.now());
        auditLogRepository.save(log);

        return result;
    }

    private boolean isMutatingMethod(Method method) {
        return method.isAnnotationPresent(PostMapping.class)
                || method.isAnnotationPresent(PutMapping.class)
                || method.isAnnotationPresent(DeleteMapping.class)
                || method.isAnnotationPresent(PatchMapping.class);
    }

    private AuditContext resolveContext(ProceedingJoinPoint joinPoint) {
        String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
        Object[] args = joinPoint.getArgs();

        if ("AdminResumeController".equals(className)) {
            Long id = firstLongArg(args);
            return new AuditContext("RESUME", id, snapshotResume(id));
        }
        if ("AdminVacancyController".equals(className)) {
            Long id = firstLongArg(args);
            return new AuditContext("VACANCY", id, snapshotVacancy(id));
        }
        if ("CompanyController".equals(className)) {
            Long id = firstLongArg(args);
            return new AuditContext("COMPANY", id, snapshotCompany(id));
        }
        if ("UserController".equals(className)) {
            Long id = firstLongArg(args);
            if (id == null) {
                id = idFromUserDtoArg(args);
            }
            return new AuditContext("USER", id, snapshotUser(id));
        }
        return new AuditContext("UNKNOWN", null, null);
    }

    private String resolveAdminEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            return "unknown";
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof Long userId) {
            return userRepository.findById(userId)
                    .map(this::safeUserIdentifier)
                    .orElse("unknown");
        }
        return String.valueOf(principal);
    }

    private String safeUserIdentifier(User user) {
        if (user.getPhone() != null && !user.getPhone().isBlank()) {
            return user.getPhone();
        }
        if (user.getUserName() != null && !user.getUserName().isBlank()) {
            return user.getUserName();
        }
        return "unknown";
    }

    private Long firstLongArg(Object[] args) {
        if (args == null) {
            return null;
        }
        for (Object arg : args) {
            if (arg instanceof Long val) {
                return val;
            }
        }
        return null;
    }

    private Long idFromUserDtoArg(Object[] args) {
        if (args == null) {
            return null;
        }
        for (Object arg : args) {
            if (arg instanceof UserDto dto) {
                return dto.getId();
            }
        }
        return null;
    }

    private String snapshotResume(Long id) {
        if (id == null) {
            return null;
        }
        return resumeRepository.findById(id)
                .map(this::toResumeSnapshot)
                .map(this::toJson)
                .orElse(null);
    }

    private String snapshotVacancy(Long id) {
        if (id == null) {
            return null;
        }
        return vacancyRepository.findById(id)
                .map(this::toVacancySnapshot)
                .map(this::toJson)
                .orElse(null);
    }

    private String snapshotCompany(Long id) {
        if (id == null) {
            return null;
        }
        return companyRepository.findById(id)
                .map(this::toCompanySnapshot)
                .map(this::toJson)
                .orElse(null);
    }

    private String snapshotUser(Long id) {
        if (id == null) {
            return null;
        }
        return userRepository.findById(id)
                .map(this::toUserSnapshot)
                .map(this::toJson)
                .orElse(null);
    }

    private Map<String, Object> toResumeSnapshot(Resume r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("name", r.getName());
        m.put("surname", r.getSurname());
        m.put("email", r.getEmail());
        m.put("phone", r.getPhone());
        m.put("position", r.getPosition());
        m.put("moderationStatus", r.getModerationStatus());
        m.put("rejectionReason", r.getRejectionReason());
        return m;
    }

    private Map<String, Object> toVacancySnapshot(Vacancy v) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", v.getId());
        m.put("jobTitle", v.getJobTitle());
        m.put("salary", v.getSalary());
        m.put("aboutCompany", v.getAboutCompany());
        m.put("moderationStatus", v.getModerationStatus());
        m.put("rejectionReason", v.getRejectionReason());
        m.put("companyId", v.getCompany() != null ? v.getCompany().getId() : null);
        return m;
    }

    private Map<String, Object> toCompanySnapshot(Company c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("inn", c.getInn());
        m.put("contacts", c.getContacts());
        m.put("moderationStatus", c.getModerationStatus());
        m.put("rejectionReason", c.getRejectionReason());
        m.put("ownerId", c.getOwner() != null ? c.getOwner().getId() : null);
        return m;
    }

    private Map<String, Object> toUserSnapshot(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("userName", u.getUserName());
        m.put("phone", u.getPhone());
        m.put("isActive", u.isActive());
        m.put("role", u.getRole() != null ? u.getRole().getName() : null);
        return m;
    }

    private String toJson(Map<String, Object> map) {
        try {
            return objectMapper.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            return "{\"error\":\"serialize_failed\"}";
        }
    }

    private Long tryResolveIdFromResult(Object result) {
        Object candidate = result;
        if (result instanceof ResponseEntity<?> responseEntity) {
            candidate = responseEntity.getBody();
        }
        if (candidate == null) {
            return null;
        }
        try {
            Method getId = candidate.getClass().getMethod("getId");
            Object id = getId.invoke(candidate);
            if (id instanceof Number n) {
                return n.longValue();
            }
        } catch (Exception ignored) {
            // no-op
        }
        return null;
    }

    @AllArgsConstructor
    private static class AuditContext {
        private String entityType;
        private Long entityId;
        private String oldValueJson;
    }
}
