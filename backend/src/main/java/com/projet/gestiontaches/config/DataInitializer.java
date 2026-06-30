package com.projet.gestiontaches.config;

import com.projet.gestiontaches.entity.Comment;
import com.projet.gestiontaches.entity.Member;
import com.projet.gestiontaches.entity.Project;
import com.projet.gestiontaches.entity.Task;
import com.projet.gestiontaches.repository.CommentRepository;
import com.projet.gestiontaches.repository.MemberRepository;
import com.projet.gestiontaches.repository.ProjectRepository;
import com.projet.gestiontaches.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final MemberRepository memberRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;

    @Override
    public void run(String... args) throws Exception {
        if (memberRepository.count() > 0) {
            // La base de données contient déjà des données, on n'initialise pas
            return;
        }

        System.out.println("====== INITIALISATION DES DONNEES DE TEST EN COURS ======");

        // 1. Création des membres de l'équipe
        Member jackson = Member.builder()
                .firstName("Jackson")
                .lastName("Koffi")
                .email("jackson.koffi@example.com")
                .role("Chef de projet / Tech Lead")
                .build();

        Member alice = Member.builder()
                .firstName("Alice")
                .lastName("Dubois")
                .email("alice.dubois@example.com")
                .role("Développeuse Fullstack")
                .build();

        Member bob = Member.builder()
                .firstName("Bob")
                .lastName("Martin")
                .email("bob.martin@example.com")
                .role("UI/UX Designer")
                .build();

        Member charlie = Member.builder()
                .firstName("Charlie")
                .lastName("Roux")
                .email("charlie.roux@example.com")
                .role("Ingénieur QA / Testeur")
                .build();

        memberRepository.saveAll(List.of(jackson, alice, bob, charlie));

        // 2. Création des projets
        Project projectEcommerce = Project.builder()
                .name("Refonte E-Commerce Premium")
                .description("Projet visant à concevoir la nouvelle plateforme e-commerce de l'entreprise avec une expérience utilisateur immersive, de superbes animations et un paiement sécurisé.")
                .status("IN_PROGRESS")
                .startDate(LocalDate.now().minusDays(10))
                .endDate(LocalDate.now().plusDays(20))
                .members(Set.of(jackson, alice, bob))
                .build();

        Project projectMobile = Project.builder()
                .name("App Mobile Gestion de Stock")
                .description("Création d'une application mobile pour les gestionnaires d'entrepôt, supportant le scan hors-ligne des codes-barres et la synchronisation automatique.")
                .status("TODO")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(45))
                .members(Set.of(jackson, alice, charlie))
                .build();

        Project projectDesign = Project.builder()
                .name("Mise en place du Design Système")
                .description("Standardiser les composants UI/UX de l'ensemble de nos produits web et mobiles avec du CSS Moderne et des tokens réutilisables.")
                .status("DONE")
                .startDate(LocalDate.now().minusDays(30))
                .endDate(LocalDate.now().minusDays(5))
                .members(Set.of(jackson, bob))
                .build();

        projectRepository.saveAll(List.of(projectEcommerce, projectMobile, projectDesign));

        // 3. Création des tâches pour le projet E-Commerce
        Task taskFigma = Task.builder()
                .title("Maquettage Figma Haute Fidélité")
                .description("Concevoir les maquettes web et mobiles de la boutique en mode clair et sombre en appliquant le Glassmorphism.")
                .status("DONE")
                .priority("HIGH")
                .estimatedHours(24)
                .loggedHours(26.0)
                .project(projectEcommerce)
                .assignee(bob)
                .build();

        Task taskDatabase = Task.builder()
                .title("Conception de la base de données PostgreSQL")
                .description("Rédiger le schéma relationnel de la base de données et configurer les entités JPA du backend.")
                .status("DONE")
                .priority("MEDIUM")
                .estimatedHours(12)
                .loggedHours(12.0)
                .project(projectEcommerce)
                .assignee(jackson)
                .build();

        Task taskRestApis = Task.builder()
                .title("Développement des APIs REST de commande")
                .description("Implémenter les contrôleurs et les services pour la gestion des paniers, commandes et facturation.")
                .status("IN_PROGRESS")
                .priority("HIGH")
                .estimatedHours(40)
                .loggedHours(15.0)
                .project(projectEcommerce)
                .assignee(alice)
                .build();

        Task taskKanbanUI = Task.builder()
                .title("Intégration du Tableau Kanban Interactif")
                .description("Créer l'interface du tableau Kanban en React avec du Drag and Drop fluide et des barres de progression animées.")
                .status("TODO")
                .priority("MEDIUM")
                .estimatedHours(30)
                .loggedHours(0.0)
                .project(projectEcommerce)
                .assignee(alice)
                .build();

        Task taskTests = Task.builder()
                .title("Tests d'intégration et charge")
                .description("Rédiger les scénarios de test avec JUnit / MockMvc et vérifier le comportement de l'API REST.")
                .status("TODO")
                .priority("LOW")
                .estimatedHours(15)
                .loggedHours(0.0)
                .project(projectEcommerce)
                .assignee(charlie)
                .build();

        taskRepository.saveAll(List.of(taskFigma, taskDatabase, taskRestApis, taskKanbanUI, taskTests));

        // 4. Création des tâches pour l'App Mobile
        Task taskSpecs = Task.builder()
                .title("Rédaction des spécifications fonctionnelles")
                .description("Détailler les cas d'utilisation pour le scan hors-ligne et l'architecture locale.")
                .status("TODO")
                .priority("HIGH")
                .estimatedHours(16)
                .loggedHours(0.0)
                .project(projectMobile)
                .assignee(jackson)
                .build();

        Task taskSetup = Task.builder()
                .title("Configuration du projet React Native")
                .description("Mettre en place la structure du projet mobile avec Expo et le routeur de navigation.")
                .status("TODO")
                .priority("MEDIUM")
                .estimatedHours(20)
                .loggedHours(0.0)
                .project(projectMobile)
                .assignee(alice)
                .build();

        taskRepository.saveAll(List.of(taskSpecs, taskSetup));

        // 5. Création des tâches pour le Design Système
        Task taskTokens = Task.builder()
                .title("Définition des tokens de couleur et polices")
                .description("Créer l'ensemble des variables CSS pour les couleurs HSL et les gradients.")
                .status("DONE")
                .priority("HIGH")
                .estimatedHours(8)
                .loggedHours(8.0)
                .project(projectDesign)
                .assignee(bob)
                .build();

        Task taskDoc = Task.builder()
                .title("Rédaction du DESIGN.md global")
                .description("Documenter les styles et bonnes pratiques d'accessibilité WCAG.")
                .status("DONE")
                .priority("LOW")
                .estimatedHours(6)
                .loggedHours(5.0)
                .project(projectDesign)
                .assignee(jackson)
                .build();

        taskRepository.saveAll(List.of(taskTokens, taskDoc));

        // 6. Création des commentaires de test
        Comment comment1 = Comment.builder()
                .content("Les maquettes Figma ont été validées par le client ! On peut démarrer le code CSS.")
                .createdAt(LocalDateTime.now().minusDays(5))
                .task(taskFigma)
                .author(bob)
                .build();

        Comment comment2 = Comment.builder()
                .content("Superbe ! J'ai déjà préparé les variables CSS pour le mode sombre.")
                .createdAt(LocalDateTime.now().minusDays(4))
                .task(taskFigma)
                .author(alice)
                .build();

        Comment comment3 = Comment.builder()
                .content("La structure de la BDD PostgreSQL est en place. Pensez à lancer le script d'initialisation.")
                .createdAt(LocalDateTime.now().minusDays(2))
                .task(taskDatabase)
                .author(jackson)
                .build();

        Comment comment4 = Comment.builder()
                .content("Je commence l'écriture des routes GET et POST pour les commandes.")
                .createdAt(LocalDateTime.now().minusDays(1))
                .task(taskRestApis)
                .author(alice)
                .build();

        commentRepository.saveAll(List.of(comment1, comment2, comment3, comment4));

        System.out.println("====== INITIALISATION DES DONNEES EFFECTUEE AVEC SUCCES ======");
    }
}
