package resume.vakansya.job;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import resume.vakansya.entities.JobApplication;
import resume.vakansya.entities.Resume;
import resume.vakansya.entities.ResumeDto;
import resume.vakansya.mappers.ResumeMapper;

@Service
@RequiredArgsConstructor
public class JobApplicationResumeSnapshotService {

    private final ObjectMapper objectMapper;
    private final ResumeMapper resumeMapper;

    public void attachSnapshot(JobApplication app, Resume resume) {
        try {
            ResumeDto dto = resumeMapper.mapToDto(resume);
            app.setResumeSnapshot(objectMapper.writeValueAsString(dto));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("resume snapshot serialization failed", e);
        }
    }

    /**
     * Снимок на момент отклика; для старых записей без снимка — актуальное резюме из связи.
     */
    public ResumeDto resumeAtApply(JobApplication app) {
        String snap = app.getResumeSnapshot();
        if (snap != null && !snap.isBlank()) {
            try {
                return objectMapper.readValue(snap, ResumeDto.class);
            } catch (JsonProcessingException ignored) {
                // fall through to live resume
            }
        }
        if (app.getResume() != null) {
            return resumeMapper.mapToDto(app.getResume());
        }
        return null;
    }
}
