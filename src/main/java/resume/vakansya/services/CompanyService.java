package resume.vakansya.services;

import resume.vakansya.entities.CompanyDto;
import resume.vakansya.entities.ModerationStatus;

import java.util.List;

public interface CompanyService {

    List<CompanyDto> list(ModerationStatus status);

    CompanyDto getById(Long id);

    CompanyDto approve(Long id);

    CompanyDto reject(Long id, String reason);

    void delete(Long id);
}
