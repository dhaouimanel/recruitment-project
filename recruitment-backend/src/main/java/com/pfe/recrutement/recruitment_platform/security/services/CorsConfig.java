package com.pfe.recrutement.recruitment_platform.security.services;

import org.springframework.beans.factory.annotation.Value;  // IMPORT CORRECT
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    // CORRECTION : Utilisez l'annotation @Value de Spring, pas Lombok
   /* @Value("${cors.allowed-origins:http://localhost:4200}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600L);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Exposer le répertoire d'uploads
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }*/
}