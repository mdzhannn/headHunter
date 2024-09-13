package resume.vakansya.services.seviceIpl;

import org.springframework.stereotype.Service;
import resume.vakansya.services.INotificationService;

import java.util.UUID;
@Service
public class NotificationServiceImpl implements INotificationService {
    @Override
    public void sendMessage(String email, String message) {
        System.out.println("Отправлено сообщение на " + email + ": " + message);
    }

    @Override
    public void sendCode(String email) {
        String code = generateVerificationCode();
        System.out.println("Отправлен код на " + email + ": " + code);
    }

    @Override
    public Boolean verify(String email, String code) {
        // Логика проверки кода подтверждения
        System.out.println("Проверка кода " + code + " для " + email);
        // Здесь будет логика проверки кода, например, сравнение с сохраненным кодом
        return true; // или false в зависимости от результата
    }

    private String generateVerificationCode() {
        // Логика генерации кода подтверждения
        return UUID.randomUUID().toString().substring(0, 6); // Пример генерации 6-значного кода
    }
}
