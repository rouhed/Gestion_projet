package com.projet.gestiontaches.repository;

import com.projet.gestiontaches.entity.Comment;
import com.projet.gestiontaches.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTaskIdOrderByCreatedAtAsc(Long taskId);
    List<Comment> findByAuthor(Member author);
}
