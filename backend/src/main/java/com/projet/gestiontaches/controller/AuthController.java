package com.projet.gestiontaches.controller;

import com.projet.gestiontaches.dto.AuthResponse;
import com.projet.gestiontaches.dto.LoginRequest;
import com.projet.gestiontaches.entity.Member;
import com.projet.gestiontaches.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin
public class AuthController {

    private final MemberRepository memberRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // 1. Vérification des identifiants admin
        if ("admin".equalsIgnoreCase(request.getEmail()) && "admin123".equals(request.getPassword())) {
            AuthResponse response = AuthResponse.builder()
                    .id(-1L) // ID spécial pour l'admin
                    .email("admin")
                    .firstName("Admin")
                    .lastName("Système")
                    .role("ADMIN")
                    .build();
            return ResponseEntity.ok(response);
        }

        // 2. Vérification des identifiants membre
        Optional<Member> memberOpt = memberRepository.findByEmail(request.getEmail());
        if (memberOpt.isPresent()) {
            Member member = memberOpt.get();
            // Comparer le mot de passe (vérification simple pour cet environnement)
            if (member.getPassword().equals(request.getPassword())) {
                AuthResponse response = AuthResponse.builder()
                        .id(member.getId())
                        .email(member.getEmail())
                        .firstName(member.getFirstName())
                        .lastName(member.getLastName())
                        .role("MEMBER")
                        .build();
                return ResponseEntity.ok(response);
            }
        }

        // 3. Authentification échouée
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Identifiants incorrects. Veuillez réessayer."));
    }
}
