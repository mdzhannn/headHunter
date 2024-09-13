package resume.vakansya.entities;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Data

public class FileDto {
    private Long id;
    private String fileName;
    private String fileType;
}
