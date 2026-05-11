package resume.vakansya.candidate;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import resume.vakansya.entities.ModerationStatus;
import resume.vakansya.entities.Vacancy;
import resume.vakansya.entities.VacancyDto;
import resume.vakansya.mappers.VacancyMapper;
import resume.vakansya.repositories.VacancyRepository;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CandidateVacancyService {

    private final VacancyRepository vacancyRepository;
    private final VacancyMapper vacancyMapper;

    private Specification<Vacancy> approvedSpec(
            Double salaryMin,
            Double salaryMax,
            String city,
            String workType,
            String experience,
            String category,
            String q) {
        Specification<Vacancy> spec = (root, query, cb) -> cb.equal(root.get("moderationStatus"), ModerationStatus.APPROVED);

        if (StringUtils.hasText(city)) {
            String like = "%" + city.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("location")), like));
        }

        if (StringUtils.hasText(workType)) {
            String like = "%" + workType.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("workType")), like));
        }

        if (StringUtils.hasText(experience)) {
            String like = "%" + experience.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("experience")), like));
        }

        if (StringUtils.hasText(category)) {
            String like = "%" + category.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("jobTitle")), like));
        }

        if (salaryMin != null) {
            Double sm = salaryMin;
            spec = spec.and((root, query, cb) -> cb.and(cb.isNotNull(root.get("salary")), cb.ge(root.get("salary"), sm)));
        }

        if (salaryMax != null) {
            Double sx = salaryMax;
            spec = spec.and((root, query, cb) -> cb.and(cb.isNotNull(root.get("salary")), cb.le(root.get("salary"), sx)));
        }

        if (StringUtils.hasText(q)) {
            String like = "%" + q.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> {
                List<Predicate> parts = new ArrayList<>();
                parts.add(cb.like(cb.lower(root.get("jobTitle")), like));
                parts.add(cb.like(cb.lower(root.get("aboutVacancy")), like));
                parts.add(cb.like(cb.lower(root.get("requirements")), like));
                parts.add(cb.like(cb.lower(root.get("aboutCompany")), like));
                return cb.or(parts.toArray(new Predicate[0]));
            });
        }
        return spec;
    }

    @Transactional(readOnly = true)
    public List<VacancyDto> searchApproved(
            Double salaryMin,
            Double salaryMax,
            String city,
            String workType,
            String experience,
            String category,
            String q) {
        Specification<Vacancy> spec = approvedSpec(salaryMin, salaryMax, city, workType, experience, category, q);

        return vacancyMapper.mapToDtoList(
                vacancyRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createDate")));
    }

    @Transactional(readOnly = true)
    public Page<VacancyDto> searchApprovedPage(
            Double salaryMin,
            Double salaryMax,
            String city,
            String workType,
            String experience,
            String category,
            String q,
            Pageable pageable) {
        Specification<Vacancy> spec = approvedSpec(salaryMin, salaryMax, city, workType, experience, category, q);
        return vacancyRepository.findAll(spec, pageable).map(vacancyMapper::mapToDto);
    }
}
