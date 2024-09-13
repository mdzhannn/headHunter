package resume.vakansya.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import resume.vakansya.services.INotificationService;

@RestController
@RequestMapping("/email")
public class NotificationController {

    private final INotificationService notificationService;

    @Autowired
    public NotificationController(INotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/send/message")
    public ResponseEntity<Void> sendMessage(@RequestParam String email, @RequestParam String message) {
        notificationService.sendMessage(email, message);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/send/code")
    public ResponseEntity<Void> sendCode(@RequestParam String email) {
        notificationService.sendCode(email);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/send/verify")
    public ResponseEntity<Boolean> verify(@RequestParam String email, @RequestParam String code) {
        Boolean result = notificationService.verify(email, code);
        return ResponseEntity.ok(result);
    }
}
