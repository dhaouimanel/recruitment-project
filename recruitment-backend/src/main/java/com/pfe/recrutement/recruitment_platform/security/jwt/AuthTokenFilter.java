package com.pfe.recrutement.recruitment_platform.security.jwt;

import com.pfe.recrutement.recruitment_platform.security.services.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

public class AuthTokenFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);

    private static final List<String> PUBLIC_PATHS = Arrays.asList(
            "/api/auth/signin",
            "/api/auth/signup",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/oauth/",
            "/api/public/",
            "/api/offers/",
            "/uploads/",
            "/v3/api-docs/",
            "/swagger-ui/",
            "/error"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            String path = request.getRequestURI();

            if (isPublicPath(path)) {
                logger.debug("🔓 Chemin public détecté : {}, poursuite sans validation JWT", path);
                chain.doFilter(request, response);
                return;
            }

            String jwt = parseJwt(request);
            if (jwt != null) {
                logger.debug("🔍 JWT reçu: {}", jwt.substring(0, Math.min(20, jwt.length())) + "...");
            } else {
                logger.debug("🔍 Aucun JWT dans l'en-tête");
            }

            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                logger.debug("✅ JWT valide");
                String username = jwtUtils.getUserNameFromJwtToken(jwt);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                logger.debug("❌ JWT invalide ou absent");
            }
        } catch (Exception e) {
            logger.error("Erreur auth: {}", e.getMessage());
        }
        chain.doFilter(request, response);
    }

    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(publicPath -> path.startsWith(publicPath));
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {

        String path = request.getRequestURI();
        return path.equals("/api/auth/signin") ||
                path.equals("/api/auth/signup") ||
                path.equals("/api/auth/forgot-password") ||
                path.equals("/api/auth/reset-password") ||
                path.startsWith("/api/auth/oauth/") ||
                path.startsWith("/api/public/") ||
                path.startsWith("/api/offers/") ||
                path.startsWith("/uploads/") ||
                path.startsWith("/v3/api-docs/") ||
                path.startsWith("/swagger-ui/")||
                path.equals("/error");
    }
}