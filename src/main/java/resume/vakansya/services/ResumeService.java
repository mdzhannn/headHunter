package resume.vakansya.services;
import org.springframework.web.multipart.MultipartFile;
import resume.vakansya.entities.ResumeDto;
import java.util.List;

public interface ResumeService {
    List<ResumeDto> getAllResume();
    ResumeDto addResume(ResumeDto addResume);
    ResumeDto getResume(Long id);
    ResumeDto updateResume(ResumeDto updResume);
    void deleteResume(Long id);

    ResumeDto getResumeById(Long id);

    void addFilesToResume(Long id, List<MultipartFile> files);
    void verifyResume(Long resumeId);

    List<ResumeDto> getPendingResumes();
}
