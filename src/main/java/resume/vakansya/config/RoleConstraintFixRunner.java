package resume.vakansya.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RoleConstraintFixRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        List<String> uniqueConstraints = jdbcTemplate.queryForList(
                """
                        select tc.constraint_name
                        from information_schema.table_constraints tc
                        join information_schema.constraint_column_usage ccu
                          on tc.constraint_name = ccu.constraint_name
                         and tc.table_schema = ccu.table_schema
                        where tc.table_schema = current_schema()
                          and tc.table_name = 'users'
                          and tc.constraint_type = 'UNIQUE'
                          and ccu.column_name = 'role_id'
                        """,
                String.class);

        for (String constraintName : uniqueConstraints) {
            jdbcTemplate.execute("alter table users drop constraint if exists " + constraintName);
        }
    }
}
