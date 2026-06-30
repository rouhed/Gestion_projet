package com.projet.gestiontaches.controller;

import com.projet.gestiontaches.dto.ProjectDTO;
import com.projet.gestiontaches.dto.ProjectStatsDTO;
import com.projet.gestiontaches.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@CrossOrigin
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectDTO> createProject(@RequestBody ProjectDTO dto) {
        return new ResponseEntity<>(projectService.createProject(dto), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ProjectDTO>> getAllProjects(@RequestParam(required = false) String status) {
        if (status != null && !status.trim().isEmpty()) {
            return ResponseEntity.ok(projectService.getProjectsByStatus(status));
        }
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDTO> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectDTO> updateProject(@PathVariable Long id, @RequestBody ProjectDTO dto) {
        return ResponseEntity.ok(projectService.updateProject(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ProjectDTO> changeProjectStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(projectService.changeProjectStatus(id, status));
    }

    @PostMapping("/{projectId}/members/{memberId}")
    public ResponseEntity<ProjectDTO> addMemberToProject(@PathVariable Long projectId, @PathVariable Long memberId) {
        return ResponseEntity.ok(projectService.addMemberToProject(projectId, memberId));
    }

    @DeleteMapping("/{projectId}/members/{memberId}")
    public ResponseEntity<ProjectDTO> removeMemberFromProject(@PathVariable Long projectId, @PathVariable Long memberId) {
        return ResponseEntity.ok(projectService.removeMemberFromProject(projectId, memberId));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<ProjectStatsDTO> getProjectStats(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectStats(id));
    }
}
