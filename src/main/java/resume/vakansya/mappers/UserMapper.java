package resume.vakansya.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import resume.vakansya.entities.User;
import resume.vakansya.entities.UserDto;

import java.util.List;
@Mapper(componentModel = "spring")
public interface UserMapper {
    List<UserDto> mapToDtoList(List<User> users);

    @Mapping(target = "roleName", expression = "java(user.getRole() != null ? user.getRole().getName() : null)")
    @Mapping(target = "adminRoleName", expression = "java(user.getAdminRole() != null ? user.getAdminRole().getName() : null)")
    UserDto mapToDto(User user);

    @Mapping(target = "role", ignore = true)
    @Mapping(target = "adminRole", ignore = true)
    @Mapping(target = "resume", ignore = true)
    @Mapping(target = "vacancy", ignore = true)
    User mapToEntity(UserDto userDto);
}
