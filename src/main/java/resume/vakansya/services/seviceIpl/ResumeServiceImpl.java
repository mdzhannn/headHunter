package resume.vakansya.services.seviceIpl;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import resume.vakansya.entities.File;
import resume.vakansya.entities.Resume;
import resume.vakansya.entities.ResumeDto;
import resume.vakansya.mappers.ResumeMapper;
import resume.vakansya.repositories.ResumeRepository;
import resume.vakansya.services.ResumeService;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ResumeServiceImpl implements ResumeService {
    @Autowired
    private final ResumeMapper resumeMapper;
    @Autowired
    private final ResumeRepository resumeRepository;
    @Override
    public List<ResumeDto> getAllResume() {
        return resumeMapper.mapToDtoList(resumeRepository.findAll());
    }
    @Override
    public ResumeDto addResume(ResumeDto addResume) {
        Resume resume = resumeMapper.mapToEntity(addResume);
        Resume resumeOne = resumeRepository.save(resume);
        return resumeMapper.mapToDto(resumeOne);
    }

    @Override
    public ResumeDto getResume(Long id) {
        return resumeMapper.mapToDto(resumeRepository.findAllById(id));
    }

    @Override
    public ResumeDto updateResume(ResumeDto updResume) {
        Resume resume = resumeMapper.mapToEntity(updResume);
        return resumeMapper.mapToDto(resumeRepository.save(resume));
    }

    @Override
    public void deleteResume(Long id) {
        resumeRepository.deleteById(id);
    }

    @Override
    public ResumeDto getResumeById(Long id) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resume not found with id " + id));
        return resumeMapper.mapToDto(resume);
    }

    @Override
    @Transactional
    public void addFilesToResume(Long id, List<MultipartFile> files) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resume not found with id " + id));
        for (MultipartFile file : files) {
            try {
                String filename = file.getOriginalFilename();
                byte[] data = file.getBytes();
                File fileEntity = new File();
                fileEntity.setFileName(filename);
                fileEntity.setFileType(file.getContentType());
                fileEntity.setData(data);
                fileEntity.setResume(resume);

                resume.getFiles().add(fileEntity);
            } catch (IOException e) {
                throw new RuntimeException("Failed to read file data", e);
            }
        }
        resumeRepository.save(resume);
    }
    @Autowired
    public ResumeServiceImpl(ResumeMapper resumeMapper, ResumeRepository resumeRepository) {
        this.resumeMapper = resumeMapper;
        this.resumeRepository = resumeRepository;
    }

    @Override
    public void verifyResume(Long resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new RuntimeException("Resume not found with id: " + resumeId));
        resume.setVerify(true);
        resumeRepository.save(resume);
    }

    @Override
    public List<ResumeDto> getPendingResumes() {
        List<Resume> pendingResumes = resumeRepository.findByIsVerifyFalse();
        return pendingResumes.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private ResumeDto convertToDto(Resume resume) {
        ResumeDto resumeDto = new ResumeDto();
        resumeDto.setId(resume.getId());
        resumeDto.setVerify(resume.isVerify());
        // Заполнение остальных полей DTO
        return resumeDto;
    }
}
