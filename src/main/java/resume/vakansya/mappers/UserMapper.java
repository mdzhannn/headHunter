package resume.vakansya.mappers;

import org.mapstruct.Mapper;
import resume.vakansya.entities.User;
import resume.vakansya.entities.UserDto;

import java.util.List;
@Mapper(componentModel = "spring")
public interface UserMapper {
    List<UserDto> mapToDtoList(List<User> users);
    UserDto mapToDto(User user);
    User mapToEntity(UserDto userDto);
}
