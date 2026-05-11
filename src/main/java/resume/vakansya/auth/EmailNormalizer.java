package resume.vakansya.auth;

public final class EmailNormalizer {

    private EmailNormalizer() {
    }

    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("email required");
        }
        String email = raw.trim().toLowerCase();
        if (!email.matches("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$")) {
            throw new IllegalArgumentException("invalid email format");
        }
        return email;
    }
}
