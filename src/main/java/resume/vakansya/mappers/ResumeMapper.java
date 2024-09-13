package resume.vakansya.mappers;

import org.mapstruct.Mapper;
import resume.vakansya.entities.Resume;
import resume.vakansya.entities.ResumeDto;

import java.util.List;
@Mapper(componentModel = "spring")
public interface ResumeMapper {
    List<ResumeDto> mapToDtoList (List<Resume> resumes);
    ResumeDto mapToDto (Resume resume);
    Resume mapToEntity (ResumeDto resumeDto);

}
