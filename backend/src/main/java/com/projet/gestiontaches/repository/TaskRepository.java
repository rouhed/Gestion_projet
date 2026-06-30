package com.projet.gestiontaches.repository;

import com.projet.gestiontaches.entity.Member;
import com.projet.gestiontaches.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectId(Long projectId);
    List<Task> findByStatus(String status);
    List<Task> findByTitleContainingIgnoreCase(String title);
    List<Task> findByProjectIdAndTitleContainingIgnoreCase(Long projectId, String title);
    List<Task> findByAssignee(Member assignee);
}
