package resume.vakansya.auth;

import org.springframework.stereotype.Service;

@Service
public class EmailOtpTemplateService {

    public String otpSubject() {
        return "Код подтверждения HeadHunter";
    }

    public String otpBody(String code, int ttlMinutes) {
        return "Ваш код подтверждения: <b>" + code + "</b><br/>Код действителен " + ttlMinutes + " минут.";
    }

    public String emailConfirmedSubject() {
        return "Email подтвержден";
    }

    public String emailConfirmedBody() {
        return "Email успешно подтвержден. Теперь задайте пароль для входа в аккаунт HeadHunter.";
    }

    public String registrationCompletedSubject() {
        return "Регистрация завершена";
    }

    public String registrationCompletedBody() {
        return "Аккаунт HeadHunter создан. Теперь вы можете входить по email и паролю.";
    }

    public String passwordResetOtpSubject() {
        return "Код сброса пароля HeadHunter";
    }

    public String passwordResetOtpBody(String code, int ttlMinutes) {
        return "Ваш код для сброса пароля: <b>" + code + "</b><br/>Код действителен " + ttlMinutes + " минут.";
    }

    public String passwordResetConfirmedSubject() {
        return "Код сброса подтвержден";
    }

    public String passwordResetConfirmedBody() {
        return "Код подтвержден. Теперь установите новый пароль.";
    }

    public String passwordResetCompletedSubject() {
        return "Пароль обновлен";
    }

    public String passwordResetCompletedBody() {
        return "Пароль успешно обновлен. Теперь вы можете войти с новым паролем.";
    }
}
