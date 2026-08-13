package com.asenterprises.bms.security;

import com.asenterprises.bms.entity.UserSession;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;

import com.asenterprises.bms.repository.UserSessionRepository;

/**
 * Spring Security filter enforcing database-backed server-side session authentication.
 * Reads the HttpOnly AVEN_SESSION cookie, hashes the token, validates active session state,
 * and sets the SecurityContext authentication.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SessionAuthenticationFilter extends OncePerRequestFilter {

    private final SessionService sessionService;
    private final CustomUserDetailsService userDetailsService;
    private final UserSessionRepository userSessionRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String origin = request.getHeader("Origin");
        String userAgent = request.getHeader("User-Agent");
        String uri = request.getRequestURI();
        String rawToken = extractSessionCookie(request);
        boolean cookiePresent = (rawToken != null && !rawToken.isBlank());
        boolean sessionFound = false;
        boolean sessionExpired = false;
        boolean sessionRevoked = false;
        boolean authenticated = false;
        String authenticatedUser = null;

        try {
            if (cookiePresent) {
                String tokenHash = sessionService.hashToken(rawToken);
                Optional<UserSession> rawSessionOpt = userSessionRepository.findByTokenHash(tokenHash);
                if (rawSessionOpt.isPresent()) {
                    sessionFound = true;
                    UserSession s = rawSessionOpt.get();
                    sessionRevoked = (s.getRevokedAt() != null);
                    sessionExpired = s.isExpired();
                }
            }

            if (cookiePresent && SecurityContextHolder.getContext().getAuthentication() == null) {
                Optional<UserSession> sessionOpt = sessionService.validateSession(rawToken);

                if (sessionOpt.isPresent()) {
                    UserSession session = sessionOpt.get();
                    String username = session.getUser().getUsername();
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    authenticated = true;
                    authenticatedUser = username;
                }
            } else if (SecurityContextHolder.getContext().getAuthentication() != null) {
                authenticated = true;
                authenticatedUser = SecurityContextHolder.getContext().getAuthentication().getName();
            }
        } catch (Exception e) {
            log.error("Error processing session authentication: {}", e.getMessage());
            // Safe fallback: clear security context and continue without throwing 500
            SecurityContextHolder.clearContext();
        }

        log.info("[SESSION-DIAGNOSTIC] Filter Evaluation | Path: {} | Origin: {} | User-Agent: {} | CookiePresent: {} | SessionFound: {} | SessionExpired: {} | SessionRevoked: {} | Authenticated: {} | User: {}",
                uri, origin != null ? origin : "none", userAgent != null ? userAgent : "none",
                cookiePresent, sessionFound, sessionExpired, sessionRevoked, authenticated, authenticatedUser != null ? authenticatedUser : "none");

        filterChain.doFilter(request, response);
    }

    private String extractSessionCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        return Arrays.stream(request.getCookies())
                .filter(c -> sessionService.getCookieName().equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
