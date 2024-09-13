package resume.vakansya.services;

import resume.vakansya.entities.UserDto;

import java.util.List;

public interface UserService {
    List<UserDto> getAllUsers();
    UserDto addUser (UserDto userDto);
    UserDto getUser(Long id);
    UserDto updateUser (UserDto updUser);
    void deleteUser(Long id);
    void blockUser(Long userId);

    void unblockUser(Long userId);

}
