package resume.vakansya.mappers;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;
import resume.vakansya.entities.Vacancy;
import resume.vakansya.entities.VacancyDto;

import java.util.List;

@Mapper(componentModel = "spring")
public interface VacancyMapper {
    List<VacancyDto> mapToDtoList(List<Vacancy> vacancies);

    @Mapping(target = "companyId", expression = "java(vacancy.getCompany() != null ? vacancy.getCompany().getId() : null)")
    VacancyDto mapToDto(Vacancy vacancy);

    @Mapping(target = "user", ignore = true)
    @Mapping(target = "company", ignore = true)
    Vacancy mapToEntity(VacancyDto vacancyDto);

    @BeanMapping(
            nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
            unmappedTargetPolicy = ReportingPolicy.IGNORE)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "company", ignore = true)
    void updateVacancyFromDto(VacancyDto dto, @MappingTarget Vacancy vacancy);
}
