package resume.vakansya.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDto {
    private long totalUsers;
    private long totalCompanies;
    private long totalResumes;
    private long totalVacancies;
    private long pendingCompanies;
    private long pendingResumes;
    private long pendingVacancies;
    private List<RegistrationByDayDto> registrationsByDay = new ArrayList<>();
    private ApplicationFunnelDto applicationFunnel = new ApplicationFunnelDto();
    private List<TopEmployerDto> topEmployers = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegistrationByDayDto {
        private String date;
        private long count;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicationFunnelDto {
        private long total;
        private long reviewed;
        private long accepted;
        private long rejected;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopEmployerDto {
        private String employerName;
        private long count;
    }
}
