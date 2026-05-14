package resume.vakansya.services.seviceIpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import resume.vakansya.entities.AdminRole;
import resume.vakansya.entities.Role;
import resume.vakansya.entities.User;
import resume.vakansya.entities.UserDto;
import resume.vakansya.mappers.UserMapper;
import resume.vakansya.repositories.AdminRoleRepository;
import resume.vakansya.repositories.RoleRepository;
import resume.vakansya.repositories.UserRepository;
import resume.vakansya.services.AdminNotificationService;
import resume.vakansya.services.UserService;
import java.util.List;
@RequiredArgsConstructor
@Service
public class UserServiceImpl implements UserService {
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AdminRoleRepository adminRoleRepository;
    private final AdminNotificationService adminNotificationService;
    @Override
    public List<UserDto> getAllUsers() {
        return userMapper.mapToDtoList(userRepository.findAllWithResume());
    }

    @Override
    public UserDto addUser(UserDto userDto) {
        User user = userMapper.mapToEntity(userDto);
        Role role = resolveRole(userDto.getRoleName(), null);
        user.setRole(role);
        user.setAdminRole(resolveAdminRole(role, userDto.getAdminRoleName(), null));
        User savedUser = userRepository.save(user);
        adminNotificationService.userCreated(savedUser.getId());
        return userMapper.mapToDto(savedUser);
    }

    @Override
    public UserDto getUser(Long id) {
        return userMapper.mapToDto(userRepository.findAllById(id));
    }

    @Override
    public UserDto updateUser(UserDto updUser) {
        User existing = userRepository.findById(updUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + updUser.getId()));
        existing.setUserName(updUser.getUserName());
        existing.setPassword(updUser.getPassword());
        if (updUser.getPhone() != null) {
            existing.setPhone(updUser.getPhone().isBlank() ? null : updUser.getPhone().trim());
        }
        existing.setActive(updUser.isActive());
        Role role = resolveRole(updUser.getRoleName(), existing.getRole());
        existing.setRole(role);
        existing.setAdminRole(resolveAdminRole(role, updUser.getAdminRoleName(), existing.getAdminRole()));
        return userMapper.mapToDto(userRepository.save(existing));
    }

    @Override
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Override
    public void blockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setActive(false);
        userRepository.save(user);
    }

    @Override
    public void unblockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setActive(true);
        userRepository.save(user);
    }

    private Role resolveRole(String roleName, Role fallback) {
        if (roleName == null || roleName.isBlank()) {
            if (fallback != null) return fallback;
            return roleRepository.findByName("CANDIDATE")
                    .orElseThrow(() -> new RuntimeException("Role CANDIDATE not found"));
        }
        return roleRepository.findByName(roleName.trim().toUpperCase())
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
    }

    private AdminRole resolveAdminRole(Role role, String rawAdminRoleName, AdminRole fallback) {
        String roleName = role != null ? role.getName() : "";
        if (!"ADMIN".equalsIgnoreCase(roleName)) {
            return null;
        }
        if (rawAdminRoleName == null || rawAdminRoleName.isBlank()) {
            if (fallback != null) {
                return fallback;
            }
            return adminRoleRepository.findByName("SUPPORT")
                    .orElseThrow(() -> new RuntimeException("Admin role SUPPORT not found"));
        }
        return adminRoleRepository.findByName(rawAdminRoleName.trim().toUpperCase())
                .orElseThrow(() -> new RuntimeException("Admin role not found: " + rawAdminRoleName));
    }

}
