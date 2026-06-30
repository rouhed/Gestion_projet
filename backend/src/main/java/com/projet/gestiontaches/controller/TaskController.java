package com.projet.gestiontaches.controller;

import com.projet.gestiontaches.dto.TaskDTO;
import com.projet.gestiontaches.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin
public class TaskController {

    private final TaskService taskService;

    // --- Routes dépendantes du Projet ---

    @PostMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<TaskDTO> createTask(@PathVariable Long projectId, @RequestBody TaskDTO dto) {
        return new ResponseEntity<>(taskService.createTask(projectId, dto), HttpStatus.CREATED);
    }

    @GetMapping("/api/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskDTO>> getTasksByProjectId(
            @PathVariable Long projectId,
            @RequestParam(required = false) String title) {
        if (title != null && !title.trim().isEmpty()) {
            return ResponseEntity.ok(taskService.searchTasksInProjectByTitle(projectId, title));
        }
        return ResponseEntity.ok(taskService.getTasksByProjectId(projectId));
    }

    // --- Routes Générales sur les Tâches ---

    @GetMapping("/api/tasks/{id}")
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @PutMapping("/api/tasks/{id}")
    public ResponseEntity<TaskDTO> updateTask(@PathVariable Long id, @RequestBody TaskDTO dto) {
        return ResponseEntity.ok(taskService.updateTask(id, dto));
    }

    @DeleteMapping("/api/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/api/tasks/{id}/status")
    public ResponseEntity<TaskDTO> changeTaskStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(taskService.changeTaskStatus(id, status));
    }

    @PatchMapping("/api/tasks/{id}/assign/{memberId}")
    public ResponseEntity<TaskDTO> assignMemberToTask(@PathVariable Long id, @PathVariable Long memberId) {
        return ResponseEntity.ok(taskService.assignMemberToTask(id, memberId));
    }

    @PatchMapping("/api/tasks/{id}/hours")
    public ResponseEntity<TaskDTO> addHoursToTask(@PathVariable Long id, @RequestParam Double hours) {
        return ResponseEntity.ok(taskService.addHoursToTask(id, hours));
    }

    // --- Routes de Recherche Globale et de Filtrage ---

    @GetMapping("/api/tasks/search")
    public ResponseEntity<List<TaskDTO>> searchTasksByTitle(@RequestParam String title) {
        return ResponseEntity.ok(taskService.searchTasksByTitle(title));
    }

    @GetMapping("/api/tasks")
    public ResponseEntity<List<TaskDTO>> filterTasksByStatus(@RequestParam String status) {
        return ResponseEntity.ok(taskService.filterTasksByStatus(status));
    }
}
