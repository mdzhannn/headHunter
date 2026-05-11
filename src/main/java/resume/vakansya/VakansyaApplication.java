package resume.vakansya;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import resume.vakansya.config.AuthProperties;

@SpringBootApplication
@EnableConfigurationProperties({
        AuthProperties.class
})
public class VakansyaApplication {

	public static void main(String[] args) {
		SpringApplication.run(VakansyaApplication.class, args);
	}

}
