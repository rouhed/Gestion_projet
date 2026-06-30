package com.projet.gestiontaches.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskDTO {
    private Long id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private Integer estimatedHours;
    private Double loggedHours;
    private Long projectId;
    private String projectName;
    private MemberDTO assignee;
}
