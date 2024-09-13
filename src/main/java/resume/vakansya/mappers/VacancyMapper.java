package resume.vakansya.mappers;

import org.mapstruct.Mapper;
import resume.vakansya.entities.Vacancy;
import resume.vakansya.entities.VacancyDto;

import java.util.List;
@Mapper(componentModel = "spring")
public interface VacancyMapper {
    List<VacancyDto> mapToDtoList(List<Vacancy> vacancies);
    VacancyDto mapToDto(Vacancy vacancy);
    Vacancy mapToEntity(VacancyDto vacancyDto);
}
