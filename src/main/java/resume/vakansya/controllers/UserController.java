package resume.vakansya.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import resume.vakansya.entities.UserDto;
import resume.vakansya.services.UserService;

import java.util.List;
@RestController
@RequestMapping("/api")
public class UserController {
        @Autowired
        private UserService userService;
        @GetMapping
        public List<UserDto> getAllUsers(){
            return userService.getAllUsers();
        }
        @PostMapping
        public UserDto addUser(@RequestBody UserDto user){
            return userService.addUser(user);
        }
        @GetMapping("/{id}")
        public UserDto getUser(@PathVariable("id")Long id){
            return userService.getUser(id);
        }
        @PutMapping
        public UserDto updateUser(@RequestBody UserDto updUser){
            return userService.updateUser(updUser);
        }
        @DeleteMapping("/{id}")
        public void deleteUser(@PathVariable("id")Long id){
            userService.deleteUser(id);
        }
        @PostMapping("/{userId}/block")
        public ResponseEntity<?> blockUser(@PathVariable Long userId) {
            userService.blockUser(userId);
            return ResponseEntity.ok().build();
        }
        @PostMapping("/{userId}/unblock")
        public ResponseEntity<?> unblockUser(@PathVariable Long userId) {
            userService.unblockUser(userId);
            return ResponseEntity.ok().build();
        }
}
