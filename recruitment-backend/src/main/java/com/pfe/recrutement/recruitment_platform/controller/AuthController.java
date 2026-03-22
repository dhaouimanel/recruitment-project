package com.pfe.recrutement.recruitment_platform.controller;

import com.pfe.recrutement.recruitment_platform.model.ERole;
import com.pfe.recrutement.recruitment_platform.model.PasswordResetToken;
import com.pfe.recrutement.recruitment_platform.model.Role;
import com.pfe.recrutement.recruitment_platform.model.User;
import com.pfe.recrutement.recruitment_platform.payload.request.LoginRequest;
import com.pfe.recrutement.recruitment_platform.payload.request.SignupRequest;
import com.pfe.recrutement.recruitment_platform.payload.request.UpdateProfileRequest;
import com.pfe.recrutement.recruitment_platform.payload.response.JwtResponse;
import com.pfe.recrutement.recruitment_platform.payload.response.MessageResponse;
import com.pfe.recrutement.recruitment_platform.repositories.PasswordResetTokenRepository;
import com.pfe.recrutement.recruitment_platform.repositories.RoleRepository;
import com.pfe.recrutement.recruitment_platform.repositories.UserRepository;
import com.pfe.recrutement.recruitment_platform.security.jwt.JwtUtils;
import com.pfe.recrutement.recruitment_platform.security.services.PasswordResetService;
import com.pfe.recrutement.recruitment_platform.security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import com.pfe.recrutement.recruitment_platform.payload.request.OAuth2Request;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private RestTemplate restTemplate;


    @Value("${google.client.id}")
    private String googleClientId;

    @Value("${google.client.secret}")
    private String googleClientSecret;

    @Value("${google.redirect.uri}")
    private String googleRedirectUri;

    @Value("${linkedin.client.id}")
    private String linkedinClientId;

    @Value("${linkedin.client.secret}")
    private String linkedinClientSecret;

    @Value("${linkedin.redirect.uri}")
    private String linkedinRedirectUri;


    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));


        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getFname(),
                userDetails.getLname(),
                userDetails.getPhone(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles));

    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {

        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Username already taken"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Email already in use"));
        }

        User user = new User();
        user.setFname(signUpRequest.getFname());
        user.setLname(signUpRequest.getLname());
        user.setPhone(signUpRequest.getPhone());
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));

        Set<Role> roles = new HashSet<>();
        Set<String> strRoles = signUpRequest.getRole();

        if (strRoles == null || strRoles.isEmpty()) {
            Role candidatRole = roleRepository.findByName(ERole.ROLE_CANDIDAT)
                    .orElseThrow(() -> new RuntimeException("Role not found"));
            roles.add(candidatRole);
        } else {
            strRoles.forEach(role -> {
                switch (role.toUpperCase()) {
                    case "ADMIN":
                        roles.add(roleRepository.findByName(ERole.ROLE_ADMIN)
                                .orElseThrow(() -> new RuntimeException("Role not found")));
                        break;

                    case "RH":
                        roles.add(roleRepository.findByName(ERole.ROLE_RH)
                                .orElseThrow(() -> new RuntimeException("Role not found")));
                        break;

                    default:
                        roles.add(roleRepository.findByName(ERole.ROLE_CANDIDAT)
                                .orElseThrow(() -> new RuntimeException("Role not found")));
                }
            });
        }

        user.setRoles(roles);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully"));
    }


    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam("email") String email) {
        User user = passwordResetService.findUserByEmail(email);
        if (user == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Aucun compte associé à cet email."));
        }

        String token = UUID.randomUUID().toString();
        passwordResetService.createPasswordResetTokenForUser(user, token);
        passwordResetService.sendResetEmail(email, token);

        return ResponseEntity.ok(new MessageResponse("Un email de réinitialisation a été envoyé."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam("token") String token,
                                           @RequestParam("newPassword") String newPassword) {
        String result = passwordResetService.validatePasswordResetToken(token);
        if (result != null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Token invalide ou expiré."));
        }

        PasswordResetToken passToken = tokenRepository.findByToken(token).orElse(null);
        User user = passToken.getUser();
        passwordResetService.changeUserPassword(user, newPassword);

        return ResponseEntity.ok(new MessageResponse("Mot de passe modifié avec succès."));
    }

    @PostMapping("/oauth/google")
    public ResponseEntity<?> authenticateWithGoogle(@RequestBody OAuth2Request request) {
        try {

            String accessToken = exchangeGoogleCode(request.getCode());


            Map<String, Object> userInfo = getGoogleUserInfo(accessToken);

            String email = (String) userInfo.get("email");
            String firstName = (String) userInfo.get("given_name");
            String lastName = (String) userInfo.get("family_name");
            String providerId = (String) userInfo.get("id");


            User user = processOAuthUser(email, firstName, lastName, providerId);


            return generateJwtResponse(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Erreur lors de l'authentification Google : " + e.getMessage()));
        }
    }

    private String exchangeGoogleCode(String code) {
        String tokenEndpoint = "https://oauth2.googleapis.com/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", googleClientId);
        params.add("client_secret", googleClientSecret);
        params.add("redirect_uri", googleRedirectUri);
        params.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(tokenEndpoint, request, Map.class);
        return (String) response.getBody().get("access_token");
    }

    private Map<String, Object> getGoogleUserInfo(String accessToken) {
        String userInfoEndpoint = "https://www.googleapis.com/oauth2/v2/userinfo";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<?> entity = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(userInfoEndpoint, HttpMethod.GET, entity, Map.class);
        return response.getBody();
    }



    @PostMapping("/oauth/linkedin")
    public ResponseEntity<?> authenticateWithLinkedIn(@RequestBody OAuth2Request request) {
        try {
            // 1. Échanger le code contre un access token
            String accessToken = exchangeLinkedInCode(request.getCode());

            // 2. Récupérer les informations utilisateur
            Map<String, Object> userInfo = getLinkedInUserInfo(accessToken);

            String email = (String) userInfo.get("email");
            String firstName = (String) userInfo.get("given_name");
            String lastName = (String) userInfo.get("family_name");
            String providerId = (String) userInfo.get("id");


            User user = processOAuthUser(email, firstName, lastName, providerId);


            return generateJwtResponse(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Erreur lors de l'authentification LinkedIn : " + e.getMessage()));
        }
    }

    private String exchangeLinkedInCode(String code) {
        String tokenEndpoint = "https://www.linkedin.com/oauth/v2/accessToken";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", linkedinClientId);
        params.add("client_secret", linkedinClientSecret);
        params.add("redirect_uri", linkedinRedirectUri);
        params.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(tokenEndpoint, request, Map.class);
        return (String) response.getBody().get("access_token");
    }

    private Map<String, Object> getLinkedInUserInfo(String accessToken) {
        // Récupérer le profil de base
        String profileEndpoint = "https://api.linkedin.com/v2/me";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> profileResponse = restTemplate.exchange(profileEndpoint, HttpMethod.GET, entity, Map.class);
        Map<String, Object> profile = profileResponse.getBody();

        String emailEndpoint = "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))";
        ResponseEntity<Map> emailResponse = restTemplate.exchange(emailEndpoint, HttpMethod.GET, entity, Map.class);
        Map<String, Object> emailData = emailResponse.getBody();

        String email = extractEmailFromLinkedInResponse(emailData);

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("email", email);
        userInfo.put("given_name", profile.get("localizedFirstName"));
        userInfo.put("family_name", profile.get("localizedLastName"));
        userInfo.put("id", profile.get("id"));
        return userInfo;
    }

    private String extractEmailFromLinkedInResponse(Map<String, Object> emailData) {
        try {
            List<Map<String, Object>> elements = (List<Map<String, Object>>) emailData.get("elements");
            if (elements != null && !elements.isEmpty()) {
                Map<String, Object> element = elements.get(0);
                Map<String, Object> handle = (Map<String, Object>) element.get("handle~");
                return (String) handle.get("emailAddress");
            }
        } catch (Exception e) {
            throw new RuntimeException("Impossible d'extraire l'email depuis la réponse LinkedIn", e);
        }
        return null;
    }


    private User processOAuthUser(String email, String firstName, String lastName, String providerId) {
        // Vérifier si l'utilisateur existe déjà par email
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            return existingUser.get();
        }
        User user = new User();
        user.setEmail(email);
        user.setFname(firstName);
        user.setLname(lastName);
        String username = email.split("@")[0];

        username = makeUsernameUnique(username);
        user.setUsername(username);
        user.setPhone("");

        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));

        Set<Role> roles = new HashSet<>();
        Role candidatRole = roleRepository.findByName(ERole.ROLE_CANDIDAT)
                .orElseThrow(() -> new RuntimeException("Rôle CANDIDAT introuvable"));
        roles.add(candidatRole);
        user.setRoles(roles);

        userRepository.save(user);
        return user;
    }

    private String makeUsernameUnique(String baseUsername) {
        String username = baseUsername;
        int suffix = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + suffix;
            suffix++;
        }
        return username;
    }

    private ResponseEntity<?> generateJwtResponse(User user) {
        UserDetailsImpl userDetails = UserDetailsImpl.build(user);

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());

        String jwt = jwtUtils.generateJwtToken(authentication);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getFname(),
                userDetails.getLname(),
                userDetails.getPhone(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles));
    }



    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest updateRequest,
                                           @AuthenticationPrincipal UserDetailsImpl currentUser) {
        // Récupérer l'utilisateur depuis la base de données
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Vérifier l'unicité du username s'il a changé
        if (!user.getUsername().equals(updateRequest.getUsername()) &&
                userRepository.existsByUsername(updateRequest.getUsername())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Erreur : Ce nom d'utilisateur est déjà pris"));
        }

        // Vérifier l'unicité de l'email s'il a changé
        if (!user.getEmail().equals(updateRequest.getEmail()) &&
                userRepository.existsByEmail(updateRequest.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Erreur : Cet email est déjà utilisé"));
        }

        // Mise à jour des champs
        user.setFname(updateRequest.getFname());
        user.setLname(updateRequest.getLname());
        user.setUsername(updateRequest.getUsername());
        user.setEmail(updateRequest.getEmail());
        user.setPhone(updateRequest.getPhone());

        // Changement de mot de passe si demandé
        if (updateRequest.getNewPassword() != null && !updateRequest.getNewPassword().isEmpty()) {
            if (updateRequest.getCurrentPassword() == null || updateRequest.getCurrentPassword().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Erreur : Veuillez fournir votre mot de passe actuel"));
            }
            if (!passwordEncoder.matches(updateRequest.getCurrentPassword(), user.getPassword())) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Erreur : Mot de passe actuel incorrect"));
            }
            user.setPassword(passwordEncoder.encode(updateRequest.getNewPassword()));
        }

        userRepository.save(user);

        // Générer un nouveau token avec le nouveau username
        String newJwt = jwtUtils.generateTokenFromUsername(user.getUsername());
        logger.debug("Nouveau token généré: {}", newJwt);

        // Construire la réponse avec les informations mises à jour ET le nouveau token
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("fname", user.getFname());
        response.put("lname", user.getLname());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("roles", user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList()));
        response.put("accessToken", newJwt);

        return ResponseEntity.ok(response);
    }
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("fname", user.getFname());
        response.put("lname", user.getLname());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("roles", user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList()));
        return ResponseEntity.ok(response);
    }

}
