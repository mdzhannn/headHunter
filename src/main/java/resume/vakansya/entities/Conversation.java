package resume.vakansya.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", unique = true, nullable = false)
    private JobApplication application;

    @Column(nullable = false)
    private Long candidateUserId;

    @Column(nullable = false)
    private Long employerUserId;

    /** Кэш для списка диалогов */
    private LocalDateTime lastMessageAt;

    @Column(length = 512)
    private String lastMessagePreview;
}
