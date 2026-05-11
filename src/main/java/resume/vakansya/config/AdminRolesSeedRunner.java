package resume.vakansya.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import resume.vakansya.entities.AdminRole;
import resume.vakansya.repositories.AdminRoleRepository;

@Component
@RequiredArgsConstructor
public class AdminRolesSeedRunner implements ApplicationRunner {

    private final AdminRoleRepository adminRoleRepository;

    @Override
    public void run(ApplicationArguments args) {
        ensureRole("SUPER_ADMIN");
        ensureRole("MODERATOR");
        ensureRole("SUPPORT");
    }

    private void ensureRole(String name) {
        if (adminRoleRepository.findByName(name).isEmpty()) {
            AdminRole role = new AdminRole();
            role.setName(name);
            adminRoleRepository.save(role);
        }
    }
}
