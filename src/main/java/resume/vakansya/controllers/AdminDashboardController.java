package resume.vakansya.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import resume.vakansya.entities.AdminDashboardDto;
import resume.vakansya.services.AdminDashboardService;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR','SUPPORT')")
    public AdminDashboardDto getDashboard() {
        return adminDashboardService.getStats();
    }
}
