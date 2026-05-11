package resume.vakansya.candidate;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import resume.vakansya.services.AdminNotificationService;

@RestController
@RequestMapping("/candidate/complaints")
@RequiredArgsConstructor
public class CandidateComplaintController {

    private final AdminNotificationService adminNotificationService;

    @PostMapping
    public ResponseEntity<Void> createComplaint(@RequestBody ComplaintRequest body) {
        Long entityId = body != null ? body.getEntityId() : null;
        String msg = body != null ? body.getMessage() : null;
        adminNotificationService.complaintCreated(entityId, msg);
        return ResponseEntity.ok().build();
    }
}
