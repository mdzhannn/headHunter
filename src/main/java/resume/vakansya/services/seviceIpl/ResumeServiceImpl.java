package resume.vakansya.services.seviceIpl;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import resume.vakansya.entities.File;
import resume.vakansya.entities.ModerationStatus;
import resume.vakansya.entities.Resume;
import resume.vakansya.entities.ResumeDto;
import resume.vakansya.mappers.ResumeMapper;
import resume.vakansya.repositories.ResumeRepository;
import resume.vakansya.services.ResumeService;
import java.io.IOException;
import java.util.List;

@Service
public class ResumeServiceImpl implements ResumeService {

    private final ResumeMapper resumeMapper;
    private final ResumeRepository resumeRepository;

    public ResumeServiceImpl(ResumeMapper resumeMapper, ResumeRepository resumeRepository) {
        this.resumeMapper = resumeMapper;
        this.resumeRepository = resumeRepository;
    }

    @Override
    public List<ResumeDto> getAllResume() {
        return resumeMapper.mapToDtoList(resumeRepository.findAll());
    }

    @Override
    public ResumeDto addResume(ResumeDto addResume) {
        Resume resume = resumeMapper.mapToEntity(addResume);
        Resume saved = resumeRepository.save(resume);
        return resumeMapper.mapToDto(saved);
    }

    @Override
    public ResumeDto getResume(Long id) {
        return resumeMapper.mapToDto(resumeRepository.findAllById(id));
    }

    @Override
    public ResumeDto updateResume(ResumeDto updResume) {
        Resume existing = resumeRepository.findById(updResume.getId())
                .orElseThrow(() -> new RuntimeException("Resume not found with id: " + updResume.getId()));
        resumeMapper.updateResumeFromDto(updResume, existing);
        return resumeMapper.mapToDto(resumeRepository.save(existing));
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

    @Override
    public List<ResumeDto> getPendingResumes() {
        return resumeMapper.mapToDtoList(resumeRepository.findPendingOrLegacy());
    }

    @Override
    @Transactional
    public ResumeDto approveResume(Long id) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resume not found with id: " + id));
        resume.setModerationStatus(ModerationStatus.APPROVED);
        resume.setRejectionReason(null);
        return resumeMapper.mapToDto(resumeRepository.save(resume));
    }

    @Override
    @Transactional
    public ResumeDto rejectResume(Long id, String reason) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resume not found with id: " + id));
        resume.setModerationStatus(ModerationStatus.REJECTED);
        resume.setRejectionReason(reason != null ? reason : "");
        return resumeMapper.mapToDto(resumeRepository.save(resume));
    }
}
