package resume.vakansya.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import resume.vakansya.entities.Role;
import resume.vakansya.repositories.RoleRepository;

@Component
@RequiredArgsConstructor
public class RolesSeedRunner implements ApplicationRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(ApplicationArguments args) {
        ensureRole("CANDIDATE");
        ensureRole("EMPLOYER");
        ensureRole("BOTH");
        ensureRole("ADMIN");
    }

    private void ensureRole(String name) {
        if (roleRepository.findByName(name).isEmpty()) {
            Role r = new Role();
            r.setName(name);
            roleRepository.save(r);
        }
    }
}
