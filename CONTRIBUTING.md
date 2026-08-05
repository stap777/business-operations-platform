# Contributing to Business Operations Platform

Thank you for contributing to the **Business Operations Platform**. This document outlines our development process, branching model, coding conventions, and pull request procedures.

---

## 1. Branching Strategy

We follow the Git Flow branching strategy:

- **`main`**: Production-ready stable codebase. Direct commits are restricted.
- **`develop`**: Primary integration branch for upcoming releases. All feature branches target `develop`.
- **`feature/<feature-name>`**: Dedicated branch for new features (e.g., `feature/order-module`, `feature/customer-management`).
- **`bugfix/<issue-description>`**: Dedicated branch for bug fixes.
- **`hotfix/<issue-description>`**: Urgent fixes branched directly from `main`.

---

## 2. Commit Message Conventions

We strictly follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format
```text
<type>(<scope>): <short description>
```

### Allowed Types
- **`feat`**: A new feature for the user or system.
- **`fix`**: A bug fix.
- **`docs`**: Documentation changes only.
- **`style`**: Formatting, missing semi-colons, white-space (no code logic changes).
- **`refactor`**: Refactoring production code (no functional changes).
- **`test`**: Adding missing tests or refactoring existing tests.
- **`chore`**: Maintenance tasks, build system, or dependency updates.

### Examples
- `feat(auth): implement JWT authentication filter`
- `feat(product): add availableStock and inventory tracking`
- `fix(customer): resolve phone number unique validation constraint`
- `docs: update API endpoints table in README`

---

## 3. Development & Code Style Guidelines

- **Java Version**: Java 21 LTS features where appropriate.
- **Framework**: Spring Boot 3.3.x.
- **Architecture**: Strictly adhere to Layered Architecture (`Controller -> Service -> Repository -> Entity / DTO`).
- **Lombok**: Use `@Getter`, `@Setter`, `@SuperBuilder`, and `@RequiredArgsConstructor`. Avoid `@Data` on JPA entities to prevent cyclic hash code/string recursion.
- **Validation**: Place bean validation annotations on DTOs and entities (`jakarta.validation`).

---

## 4. Pull Request (PR) Process

1. **Branch Out**: Create your branch from `develop`.
2. **Commit Work**: Make clean, atomic commits adhering to conventional commits.
3. **Build & Test**: Ensure local Maven build succeeds before opening PR:
   ```bash
   cd backend
   mvn clean verify
   ```
4. **Open PR**: Target `develop` branch.
5. **CI/CD Checks**: Ensure GitHub Actions Maven Build workflow passes.
6. **Code Review**: At least one reviewer approval is required for merge.

---

## 5. PR Review Checklist

- [ ] Builds cleanly without errors or warnings.
- [ ] No direct exposure of JPA entities in Controller layer (Response DTOs used).
- [ ] Validations applied to incoming DTOs (`@Valid`).
- [ ] No hardcoded credentials or secrets in source code.
- [ ] Proper exception handling via `GlobalExceptionHandler`.
