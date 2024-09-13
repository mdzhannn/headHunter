package resume.vakansya.services;

public interface INotificationService {
    void sendMessage(String email, String message);
    void sendCode(String email);
    Boolean verify(String email, String code);
}
