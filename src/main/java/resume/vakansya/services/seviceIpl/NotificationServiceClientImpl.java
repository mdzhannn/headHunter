package resume.vakansya.services.seviceIpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import resume.vakansya.services.INotificationServiceClient;
@Service
public class NotificationServiceClientImpl implements INotificationServiceClient {
    private final RestTemplate restTemplate;
    @Autowired
    public NotificationServiceClientImpl(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public void sendMessage(String email, String message) {
            MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
            form.add("email", email);
            form.add("message", message);
            String url = "http://localhost:8080/email/send/message";
            restTemplate.postForEntity(url, form, String.class);
        }
        @Override
        public void sendCode(String email) {
            MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
            form.add("email", email);
            String url = "http://localhost:8080/email/send/code";
            restTemplate.postForEntity(url, form, String.class);
        }

        @Override
        public Boolean verify(String email, String code) {
            MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
            form.add("email", email);
            form.add("code", code);
            String url = "http://localhost:8080/email/send/verify?email=" + email + "&code=" + code;
            ResponseEntity<Boolean> responseEntity = restTemplate.getForEntity(url, Boolean.class);
            return responseEntity.getBody();
        }
    }
