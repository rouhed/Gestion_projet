package com.projet.gestiontaches.service;

import com.projet.gestiontaches.dto.TaskDTO;
import com.projet.gestiontaches.entity.Member;
import com.projet.gestiontaches.entity.Project;
import com.projet.gestiontaches.entity.Task;
import com.projet.gestiontaches.exception.ResourceNotFoundException;
import com.projet.gestiontaches.repository.MemberRepository;
import com.projet.gestiontaches.repository.ProjectRepository;
import com.projet.gestiontaches.repository.TaskRepository;
import com.projet.gestiontaches.repository.CommentRepository;
import com.projet.gestiontaches.entity.Comment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final MemberRepository memberRepository;
    private final MemberService memberService;
    private final CommentRepository commentRepository;

    @Transactional
    public TaskDTO createTask(Long projectId, TaskDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé avec l'id: " + projectId));
        
        Task task = convertToEntity(dto);
        task.setProject(project);
        if (task.getStatus() == null) {
            task.setStatus("TODO");
        }
        if (task.getPriority() == null) {
            task.setPriority("MEDIUM");
        }
        
        // Gérer l'assignation initiale du membre
        if (dto.getAssignee() != null && dto.getAssignee().getId() != null) {
            Member assignee = memberRepository.findById(dto.getAssignee().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Membre non trouvé avec l'id: " + dto.getAssignee().getId()));
            task.setAssignee(assignee);
        }
        
        Task saved = taskRepository.save(task);
        return convertToDTO(saved);
    }

    public List<TaskDTO> getTasksByProjectId(Long projectId) {
        // Optionnel : vérifier si le projet existe
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Projet non trouvé avec l'id: " + projectId);
        }
        return taskRepository.findByProjectId(projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public TaskDTO getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée avec l'id: " + id));
        return convertToDTO(task);
    }

    public TaskDTO updateTask(Long id, TaskDTO dto) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée avec l'id: " + id));
        
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setStatus(dto.getStatus());
        task.setPriority(dto.getPriority());
        task.setEstimatedHours(dto.getEstimatedHours());
        task.setLoggedHours(dto.getLoggedHours());
        
        if (dto.getAssignee() != null && dto.getAssignee().getId() != null) {
            Member assignee = memberRepository.findById(dto.getAssignee().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Membre non trouvé avec l'id: " + dto.getAssignee().getId()));
            task.setAssignee(assignee);
        } else {
            task.setAssignee(null);
        }
        
        Task updated = taskRepository.save(task);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée avec l'id: " + id));
        
        // Supprimer tous les commentaires de la tâche d'abord
        List<Comment> comments = commentRepository.findByTaskIdOrderByCreatedAtAsc(id);
        commentRepository.deleteAll(comments);
        
        taskRepository.delete(task);
    }

    public TaskDTO changeTaskStatus(Long id, String status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée avec l'id: " + id));
        task.setStatus(status);
        Task updated = taskRepository.save(task);
        return convertToDTO(updated);
    }

    @Transactional
    public TaskDTO assignMemberToTask(Long id, Long memberId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée avec l'id: " + id));
        
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Membre non trouvé avec l'id: " + memberId));
        
        task.setAssignee(member);
        
        Task updated = taskRepository.save(task);
        return convertToDTO(updated);
    }

    public TaskDTO addHoursToTask(Long id, Double hours) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée avec l'id: " + id));
        
        task.setLoggedHours(task.getLoggedHours() + hours);
        Task updated = taskRepository.save(task);
        return convertToDTO(updated);
    }

    public List<TaskDTO> searchTasksByTitle(String title) {
        return taskRepository.findByTitleContainingIgnoreCase(title).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TaskDTO> filterTasksByStatus(String status) {
        return taskRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TaskDTO> searchTasksInProjectByTitle(Long projectId, String title) {
        return taskRepository.findByProjectIdAndTitleContainingIgnoreCase(projectId, title).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public TaskDTO convertToDTO(Task task) {
        if (task == null) return null;
        return TaskDTO.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .estimatedHours(task.getEstimatedHours())
                .loggedHours(task.getLoggedHours())
                .projectId(task.getProject().getId())
                .projectName(task.getProject().getName())
                .assignee(memberService.convertToDTO(task.getAssignee()))
                .build();
    }

    public Task convertToEntity(TaskDTO dto) {
        if (dto == null) return null;
        return Task.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .status(dto.getStatus())
                .priority(dto.getPriority())
                .estimatedHours(dto.getEstimatedHours() == null ? 0 : dto.getEstimatedHours())
                .loggedHours(dto.getLoggedHours() == null ? 0.0 : dto.getLoggedHours())
                .build();
    }
}
