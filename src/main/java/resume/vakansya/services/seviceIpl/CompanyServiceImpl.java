package resume.vakansya.services.seviceIpl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import resume.vakansya.entities.Company;
import resume.vakansya.entities.CompanyDto;
import resume.vakansya.entities.ModerationStatus;
import resume.vakansya.entities.Vacancy;
import resume.vakansya.mappers.CompanyMapper;
import resume.vakansya.repositories.CompanyRepository;
import resume.vakansya.repositories.VacancyRepository;
import resume.vakansya.services.CompanyService;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;
    private final VacancyRepository vacancyRepository;
    private final CompanyMapper companyMapper;

    @Override
    @Transactional(readOnly = true)
    public List<CompanyDto> list(ModerationStatus status) {
        List<Company> companies = status == null
                ? companyRepository.findAll()
                : companyRepository.findByModerationStatus(status);
        return companies.stream()
                .sorted(Comparator.comparing(Company::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(companyMapper::mapToDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyDto getById(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Company not found: " + id));
        return companyMapper.mapToDto(company);
    }

    @Override
    @Transactional
    public CompanyDto approve(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Company not found: " + id));
        company.setModerationStatus(ModerationStatus.APPROVED);
        company.setRejectionReason(null);
        return companyMapper.mapToDto(companyRepository.save(company));
    }

    @Override
    @Transactional
    public CompanyDto reject(Long id, String reason) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Company not found: " + id));
        company.setModerationStatus(ModerationStatus.REJECTED);
        company.setRejectionReason(reason != null ? reason : "");
        return companyMapper.mapToDto(companyRepository.save(company));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!companyRepository.existsById(id)) {
            throw new IllegalArgumentException("Company not found: " + id);
        }
        List<Vacancy> linked = vacancyRepository.findByCompany_Id(id);
        for (Vacancy v : linked) {
            v.setCompany(null);
        }
        vacancyRepository.saveAll(linked);
        companyRepository.deleteById(id);
    }
}
