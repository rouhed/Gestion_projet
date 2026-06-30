package com.projet.gestiontaches.service;

import com.projet.gestiontaches.dto.MemberDTO;
import com.projet.gestiontaches.entity.Member;
import com.projet.gestiontaches.entity.Project;
import com.projet.gestiontaches.entity.Task;
import com.projet.gestiontaches.entity.Comment;
import com.projet.gestiontaches.exception.ResourceNotFoundException;
import com.projet.gestiontaches.repository.MemberRepository;
import com.projet.gestiontaches.repository.ProjectRepository;
import com.projet.gestiontaches.repository.TaskRepository;
import com.projet.gestiontaches.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;

    public MemberDTO createMember(MemberDTO dto) {
        Member member = convertToEntity(dto);
        Member saved = memberRepository.save(member);
        return convertToDTO(saved);
    }

    public List<MemberDTO> getAllMembers() {
        return memberRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public MemberDTO getMemberById(Long id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Membre non trouvé avec l'id: " + id));
        return convertToDTO(member);
    }

    public MemberDTO updateMember(Long id, MemberDTO dto) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Membre non trouvé avec l'id: " + id));
        member.setFirstName(dto.getFirstName());
        member.setLastName(dto.getLastName());
        member.setEmail(dto.getEmail());
        member.setRole(dto.getRole());
        Member updated = memberRepository.save(member);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteMember(Long id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Membre non trouvé avec l'id: " + id));
        
        // 1. Supprimer tous les commentaires écrits par ce membre
        List<Comment> comments = commentRepository.findByAuthor(member);
        commentRepository.deleteAll(comments);
        
        // 2. Mettre à null l'assignation du membre sur toutes les tâches
        List<Task> tasks = taskRepository.findByAssignee(member);
        for (Task task : tasks) {
            task.setAssignee(null);
            taskRepository.save(task);
        }
        
        // 3. Retirer le membre de tous les projets (relation project_members)
        List<Project> projects = projectRepository.findAll();
        for (Project proj : projects) {
            if (proj.getMembers().contains(member)) {
                proj.getMembers().remove(member);
                projectRepository.save(proj);
            }
        }
        
        // 4. Supprimer le membre
        memberRepository.delete(member);
    }

    public MemberDTO convertToDTO(Member member) {
        if (member == null) return null;
        return MemberDTO.builder()
                .id(member.getId())
                .firstName(member.getFirstName())
                .lastName(member.getLastName())
                .email(member.getEmail())
                .role(member.getRole())
                .build();
    }

    public Member convertToEntity(MemberDTO dto) {
        if (dto == null) return null;
        return Member.builder()
                .id(dto.getId())
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .role(dto.getRole())
                .build();
    }
}
