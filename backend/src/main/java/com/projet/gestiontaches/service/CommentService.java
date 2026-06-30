package com.projet.gestiontaches.service;

import com.projet.gestiontaches.dto.CommentDTO;
import com.projet.gestiontaches.entity.Comment;
import com.projet.gestiontaches.entity.Member;
import com.projet.gestiontaches.entity.Task;
import com.projet.gestiontaches.exception.ResourceNotFoundException;
import com.projet.gestiontaches.repository.CommentRepository;
import com.projet.gestiontaches.repository.MemberRepository;
import com.projet.gestiontaches.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final MemberRepository memberRepository;
    private final MemberService memberService;

    public CommentDTO addCommentToTask(Long taskId, CommentDTO dto) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée avec l'id: " + taskId));
        
        if (dto.getAuthor() == null || dto.getAuthor().getId() == null) {
            throw new IllegalArgumentException("L'auteur du commentaire doit être spécifié avec un id valide.");
        }
        
        Member author = memberRepository.findById(dto.getAuthor().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Membre non trouvé avec l'id: " + dto.getAuthor().getId()));
        
        Comment comment = Comment.builder()
                .content(dto.getContent())
                .createdAt(LocalDateTime.now())
                .task(task)
                .author(author)
                .build();
        
        Comment saved = commentRepository.save(comment);
        return convertToDTO(saved);
    }

    public List<CommentDTO> getCommentsByTaskId(Long taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new ResourceNotFoundException("Tâche non trouvée avec l'id: " + taskId);
        }
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CommentDTO updateComment(Long id, CommentDTO dto) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commentaire non trouvé avec l'id: " + id));
        comment.setContent(dto.getContent());
        Comment updated = commentRepository.save(comment);
        return convertToDTO(updated);
    }

    public void deleteComment(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commentaire non trouvé avec l'id: " + id));
        commentRepository.delete(comment);
    }

    public CommentDTO convertToDTO(Comment comment) {
        if (comment == null) return null;
        return CommentDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .taskId(comment.getTask().getId())
                .author(memberService.convertToDTO(comment.getAuthor()))
                .build();
    }
}
