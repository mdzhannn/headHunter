package resume.vakansya.services;

public interface INotificationServiceClient {
    void sendMessage(String email, String message);
    void sendCode(String email);
    Boolean verify(String email, String code);
}
