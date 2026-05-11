package resume.vakansya.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import resume.vakansya.entities.Company;
import resume.vakansya.entities.CompanyDto;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CompanyMapper {

    @Mapping(target = "ownerId", source = "owner.id")
    CompanyDto mapToDto(Company company);

    List<CompanyDto> mapToDtoList(List<Company> companies);
}
