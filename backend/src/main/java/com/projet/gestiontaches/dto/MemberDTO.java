package com.projet.gestiontaches.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
}
