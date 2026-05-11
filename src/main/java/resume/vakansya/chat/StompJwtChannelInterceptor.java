package resume.vakansya.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import resume.vakansya.auth.JwtService;

import java.security.Principal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class StompJwtChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final ConversationService conversationService;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            if (authHeaders == null || authHeaders.isEmpty()) {
                throw new AccessDeniedException("Missing Authorization header");
            }
            try {
                Long userId = jwtService.parseUserId(authHeaders.get(0));
                String role = jwtService.parseRole(authHeaders.get(0));
                String adminRole = jwtService.parseAdminRole(authHeaders.get(0));
                List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
                if ("CANDIDATE".equals(role) || "BOTH".equals(role)) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_CANDIDATE"));
                }
                if ("EMPLOYER".equals(role) || "BOTH".equals(role)) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_EMPLOYER"));
                }
                if ("ADMIN".equals(role)) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                    if (adminRole != null && !adminRole.isBlank()) {
                        authorities.add(new SimpleGrantedAuthority(adminRole.trim().toUpperCase()));
                    }
                }
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        authorities);
                accessor.setUser(authentication);
            } catch (Exception ex) {
                throw new AccessDeniedException("Invalid token", ex);
            }
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String dest = accessor.getDestination();
            if (dest != null && dest.startsWith("/topic/conversation.")) {
                String suffix = dest.substring("/topic/conversation.".length());
                try {
                    long convId = Long.parseLong(suffix);
                    Principal principal = accessor.getUser();
                    if (!(principal instanceof Authentication authentication)
                            || !(authentication.getPrincipal() instanceof Long uid)) {
                        throw new AccessDeniedException("Unauthorized");
                    }
                    conversationService.requireParticipantStomp(convId, uid);
                } catch (NumberFormatException e) {
                    throw new AccessDeniedException("Bad topic");
                }
            }
            if (dest != null && dest.startsWith("/topic/admin-notifications")) {
                Principal principal = accessor.getUser();
                if (!(principal instanceof Authentication authentication)) {
                    throw new AccessDeniedException("Unauthorized");
                }
                boolean isAdmin = authentication.getAuthorities().stream()
                        .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
                if (!isAdmin) {
                    throw new AccessDeniedException("Admin only topic");
                }
            }
        }

        return message;
    }
}
