package resume.vakansya.mappers;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;
import resume.vakansya.entities.Resume;
import resume.vakansya.entities.ResumeDto;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ResumeMapper {
    List<ResumeDto> mapToDtoList(List<Resume> resumes);

    ResumeDto mapToDto(Resume resume);

    @Mapping(target = "user", ignore = true)
    @Mapping(target = "files", ignore = true)
    Resume mapToEntity(ResumeDto resumeDto);

    @BeanMapping(
            nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
            unmappedTargetPolicy = ReportingPolicy.IGNORE)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "files", ignore = true)
    void updateResumeFromDto(ResumeDto dto, @MappingTarget Resume resume);
}
