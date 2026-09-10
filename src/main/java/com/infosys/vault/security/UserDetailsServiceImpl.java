package com.infosys.vault.security;

import com.infosys.vault.model.User;
import com.infosys.vault.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String idOrEmail) throws UsernameNotFoundException {
        User user = null;
        try {
            Long id = Long.parseLong(idOrEmail);
            user = userRepository.findById(id).orElse(null);
        } catch (NumberFormatException ignored) {
        }
        if (user == null) {
            user = userRepository.findByEmail(idOrEmail)
                    .orElseThrow(() -> new UsernameNotFoundException("User Not Found with id/email: " + idOrEmail));
        }

        return new org.springframework.security.core.userdetails.User(
                String.valueOf(user.getId()),
                user.getPasswordHash(),
                Collections.emptyList()
        );
    }
}
