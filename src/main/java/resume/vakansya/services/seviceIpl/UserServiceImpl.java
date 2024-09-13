package resume.vakansya.services.seviceIpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import resume.vakansya.entities.User;
import resume.vakansya.entities.UserDto;
import resume.vakansya.mappers.UserMapper;
import resume.vakansya.repositories.UserRepository;
import resume.vakansya.services.UserService;
import java.util.List;
@RequiredArgsConstructor
@Service
public class UserServiceImpl implements UserService {
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    @Override
    public List<UserDto> getAllUsers() {
        return userMapper.mapToDtoList(userRepository.findAll());
    }

    @Override
    public UserDto addUser(UserDto userDto) {
        User user = userMapper.mapToEntity(userDto);
        User savedUser = userRepository.save(user);
        return userMapper.mapToDto(savedUser);
    }

    @Override
    public UserDto getUser(Long id) {
        return userMapper.mapToDto(userRepository.findAllById(id));
    }

    @Override
    public UserDto updateUser(UserDto updUser) {
        User user =  userMapper.mapToEntity(updUser);
        return userMapper.mapToDto(userRepository.save(user));
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

}
