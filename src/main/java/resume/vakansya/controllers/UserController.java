package resume.vakansya.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import resume.vakansya.entities.UserDto;
import resume.vakansya.services.UserService;

import java.util.List;
@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/api")
public class UserController {
        @Autowired
        private UserService userService;
        @GetMapping
        @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR','SUPPORT')")
        public List<UserDto> getAllUsers(){
            return userService.getAllUsers();
        }
        @PostMapping
        @PreAuthorize("hasAuthority('SUPER_ADMIN')")
        public UserDto addUser(@RequestBody UserDto user){
            return userService.addUser(user);
        }
        @GetMapping("/{id}")
        @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','MODERATOR','SUPPORT')")
        public UserDto getUser(@PathVariable("id")Long id){
            return userService.getUser(id);
        }
        @PutMapping
        @PreAuthorize("hasAuthority('SUPER_ADMIN')")
        public UserDto updateUser(@RequestBody UserDto updUser){
            return userService.updateUser(updUser);
        }
        @DeleteMapping("/{id}")
        @PreAuthorize("hasAuthority('SUPER_ADMIN')")
        public void deleteUser(@PathVariable("id")Long id){
            userService.deleteUser(id);
        }
        @PostMapping("/{userId}/block")
        @PreAuthorize("hasAuthority('SUPER_ADMIN')")
        public ResponseEntity<?> blockUser(@PathVariable Long userId) {
            userService.blockUser(userId);
            return ResponseEntity.ok().build();
        }
        @PostMapping("/{userId}/unblock")
        @PreAuthorize("hasAuthority('SUPER_ADMIN')")
        public ResponseEntity<?> unblockUser(@PathVariable Long userId) {
            userService.unblockUser(userId);
            return ResponseEntity.ok().build();
        }
}
