package resume.vakansya.services;

public interface NotificationService {
    void  sendVerificationCode(String email);
    void sendMessage(String email,String message);
    boolean verify (String email, String code);

}
