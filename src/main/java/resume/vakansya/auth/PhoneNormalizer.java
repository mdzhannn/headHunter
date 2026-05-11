package resume.vakansya.auth;

public final class PhoneNormalizer {

    private PhoneNormalizer() {
    }

    /**
     * Нормализация к виду +XXXXXXXXXXX (цифры после +, 10–15 цифр).
     */
    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("phone required");
        }
        String s = raw.trim().replaceAll("[\\s-]+", "");
        if (!s.startsWith("+")) {
            s = "+" + s;
        }
        String digits = s.substring(1).replaceAll("\\D", "");
        if (digits.length() < 10 || digits.length() > 15) {
            throw new IllegalArgumentException("invalid phone length");
        }
        return "+" + digits;
    }
}
