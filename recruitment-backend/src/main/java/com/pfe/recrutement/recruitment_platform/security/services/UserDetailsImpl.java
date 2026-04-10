package com.pfe.recrutement.recruitment_platform.security.services;

import com.pfe.recrutement.recruitment_platform.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

public class UserDetailsImpl implements UserDetails {

    private Long id;
    private String fname;
    private String lname;
    private String phone;
    private String username;
    private String email;
    private String password;

    private Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(Long id, String fname, String lname, String phone,
                           String username, String email, String password,
                           Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.fname = fname;
        this.lname = lname;
        this.phone = phone;
        this.username = username;
        this.email = email;
        this.password = password;
        this.authorities = authorities;
    }

    public static UserDetailsImpl build(User user) {
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                .collect(Collectors.toList());

        return new UserDetailsImpl(
                user.getId(),
                user.getFname(),
                user.getLname(),
                user.getPhone(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                authorities
        );
    }

    public Long getId() { return id; }
    public String getFname() { return fname; }
    public String getLname() { return lname; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }
    @Override
    public String getPassword() { return password; }
    @Override
    public String getUsername() { return username; }
    @Override
    public boolean isAccountNonExpired() { return true; }
    @Override
    public boolean isAccountNonLocked() { return true; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled() { return true; }
}
