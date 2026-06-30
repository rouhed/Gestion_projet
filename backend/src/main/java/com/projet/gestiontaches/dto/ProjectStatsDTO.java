package com.projet.gestiontaches.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectStatsDTO {
    private Long projectId;
    private String projectName;
    private int totalTasks;
    private int completedTasks;
    private int totalEstimatedHours;
    private double totalLoggedHours;
    private double completionPercentage;
}
