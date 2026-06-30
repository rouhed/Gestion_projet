package com.projet.gestiontaches.service;

import com.projet.gestiontaches.dto.MemberDTO;
import com.projet.gestiontaches.dto.ProjectDTO;
import com.projet.gestiontaches.dto.ProjectStatsDTO;
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
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final MemberRepository memberRepository;
    private final TaskRepository taskRepository;
    private final MemberService memberService;
    private final CommentRepository commentRepository;

    public ProjectDTO createProject(ProjectDTO dto) {
        Project project = convertToEntity(dto);
        if (project.getStatus() == null) {
            project.setStatus("TODO");
        }
        Project saved = projectRepository.save(project);
        return convertToDTO(saved);
    }

    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ProjectDTO> getProjectsByStatus(String status) {
        return projectRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ProjectDTO getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé avec l'id: " + id));
        return convertToDTO(project);
    }

    public ProjectDTO updateProject(Long id, ProjectDTO dto) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé avec l'id: " + id));
        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setStatus(dto.getStatus());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        Project updated = projectRepository.save(project);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé avec l'id: " + id));
        
        // Supprimer d'abord les commentaires de toutes les tâches du projet
        List<Task> tasks = taskRepository.findByProjectId(id);
        for (Task task : tasks) {
            List<Comment> comments = commentRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());
            commentRepository.deleteAll(comments);
        }
        
        // Supprimer ensuite les tâches
        taskRepository.deleteAll(tasks);
        
        // Supprimer enfin le projet
        projectRepository.delete(project);
    }

    public ProjectDTO changeProjectStatus(Long id, String status) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé avec l'id: " + id));
        project.setStatus(status);
        Project updated = projectRepository.save(project);
        return convertToDTO(updated);
    }

    @Transactional
    public ProjectDTO addMemberToProject(Long projectId, Long memberId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé avec l'id: " + projectId));
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Membre non trouvé avec l'id: " + memberId));
        
        project.getMembers().add(member);
        Project saved = projectRepository.save(project);
        return convertToDTO(saved);
    }

    @Transactional
    public ProjectDTO removeMemberFromProject(Long projectId, Long memberId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé avec l'id: " + projectId));
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Membre non trouvé avec l'id: " + memberId));
        
        project.getMembers().remove(member);
        Project saved = projectRepository.save(project);
        return convertToDTO(saved);
    }

    public ProjectStatsDTO getProjectStats(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé avec l'id: " + id));
        
        List<Task> tasks = taskRepository.findByProjectId(id);
        int totalTasks = tasks.size();
        int completedTasks = (int) tasks.stream().filter(t -> "DONE".equalsIgnoreCase(t.getStatus())).count();
        int totalEstimatedHours = tasks.stream().mapToInt(Task::getEstimatedHours).sum();
        double totalLoggedHours = tasks.stream().mapToDouble(Task::getLoggedHours).sum();
        double completionPercentage = totalTasks > 0 ? (completedTasks * 100.0) / totalTasks : 0.0;

        return ProjectStatsDTO.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .totalEstimatedHours(totalEstimatedHours)
                .totalLoggedHours(totalLoggedHours)
                .completionPercentage(Math.round(completionPercentage * 100.0) / 100.0)
                .build();
    }

    public ProjectDTO convertToDTO(Project project) {
        if (project == null) return null;
        Set<MemberDTO> memberDTOs = project.getMembers().stream()
                .map(memberService::convertToDTO)
                .collect(Collectors.toSet());

        return ProjectDTO.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .members(memberDTOs)
                .build();
    }

    public Project convertToEntity(ProjectDTO dto) {
        if (dto == null) return null;
        Set<Member> members = dto.getMembers() == null ? Set.of() : dto.getMembers().stream()
                .map(memberService::convertToEntity)
                .collect(Collectors.toSet());

        return Project.builder()
                .id(dto.getId())
                .name(dto.getName())
                .description(dto.getDescription())
                .status(dto.getStatus())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .members(members)
                .build();
    }
}
