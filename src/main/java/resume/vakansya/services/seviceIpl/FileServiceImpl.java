package resume.vakansya.services.seviceIpl;

import org.springframework.stereotype.Service;
import resume.vakansya.services.FileService;

@Service
public class FileServiceImpl implements FileService {
    @Override
    public String addFilesToResume(String filename, byte[] data) {
        return "fileId";
    }
}
