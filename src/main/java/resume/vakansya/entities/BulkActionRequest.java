package resume.vakansya.entities;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BulkActionRequest {
    private List<Long> ids;
    private String action;
}
