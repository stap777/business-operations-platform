# Business Operations Platform (BMS)

[![Java CI/CD Build](https://github.com/stap777/business-operations-platform/actions/workflows/maven-build.yml/badge.svg)](https://github.com/stap777/business-operations-platform/actions/workflows/maven-build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java Version](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://www.oracle.com/java/)

A production-ready Enterprise Business Operations & Resource Management System engineered with Spring Boot 3, Java 21, PostgreSQL, and Spring Security with JWT authentication. Designed for scalable multi-module inventory, customer lifecycle, and order processing workflows.

---

## 📋 Table of Contents

- [Business Problem](#-business-problem)
- [Solution Overview](#-solution-overview)
- [System Architecture](#-system-architecture)
- [Current Features](#-current-features)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Backend Setup & Running](#-backend-setup--running)
- [API Documentation](#-api-documentation)
- [Development & Git Workflow](#-development--git-workflow)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 💼 Business Problem

Modern distribution enterprises and wholesale suppliers face operational bottlenecks due to fragmented business tools:
- **Uncoordinated Customer Tracking**: Inconsistent client profiles, duplicate mobile records, and lack of client status tracking.
- **Inventory Discrepancies**: Manual stock tracking leads to stockouts, inaccurate inventory valuations, and price mismatches between purchase cost and selling rates.
- **Security & Authorization Risks**: Unprotected system access without role-based operational permissions or security auditing.

---

## 💡 Solution Overview

The **Business Operations Platform** provides an integrated RESTful backend platform that unifies enterprise workflows into robust modules:
1. **Stateless Security Core**: Role-Based Access Control (RBAC) with JWT tokens and BCrypt password encryption.
2. **Customer Lifecycle Management**: Automated customer code generation (`CUST-0001`), Indian mobile regex validation, and status tracking.
3. **Category & Inventory-Ready Product Catalog**: Hierarchical product classification, price threshold validations (`Selling Price >= Purchase Price`), non-negative stock tracking (`availableStock`), and non-physical service flags (`trackInventory`).

---

## 🏗️ System Architecture

The application follows a clean, production-grade **Layered Controller-Service-Repository-DTO Architecture**:

```text
               ┌────────────────────────┐
               │    REST Controllers    │  <- Endpoints (/api/v1/*)
               └───────────┬────────────┘
                           │ DTOs (Request / Response)
               ┌───────────▼────────────┐
               │    Service Layer       │  <- Business Logic & Validations
               └───────────┬────────────┘
                           │ Entities
               ┌───────────▼────────────┐
               │   Spring Data JPA      │  <- Repositories & JPQL Queries
               └───────────┬────────────┘
                           │ JDBC / HikariCP
               ┌───────────▼────────────┐
               │   PostgreSQL Database  │  <- Relational Tables & Indexes
               └────────────────────────┘
```

---

## ✨ Current Features

### 🔒 1. Authentication Module
- **Stateless JWT Security**: HMAC-SHA signed JWT generation with 24-hour expiration TTL.
- **Role-Based Access Control (RBAC)**: Support for `ADMIN`, `MANAGER`, and `DELIVERY` roles.
- **First Login Password Change**: Automatic mandatory password rotation flag (`firstLogin`).
- **Endpoint**: `POST /api/v1/auth/login`

### 👥 2. Customer Management Module
- **Code Generation**: Unique auto-formatted customer codes (`CUST-0001`, `CUST-0002`...).
- **Validation**: Indian mobile number regex validation (`^[6-9]\d{9}$`) and duplicate checking.
- **Paginated Search**: Case-insensitive search across name and phone fields.
- **Dropdown API**: Lightweight selection endpoint for order integration (`GET /api/v1/customers/dropdown`).
- **Endpoints**: `POST`, `GET /{id}`, `PUT /{id}`, `GET /search`, `GET /dropdown`, `PATCH /{id}/deactivate` under `/api/v1/customers`.

### 📦 3. Category & Product Module
- **Category Hierarchy**: Category creation, updates, and active product dependency checks before deactivation.
- **Inventory Units**: Measurement unit support (`BARREL`, `BOTTLE`, `BOX`, `PCS`).
- **Inventory Tracking Flag**: `trackInventory` support for physical goods vs. service catalog items.
- **Price & Stock Guardrails**: Enforces `Selling Price >= Purchase Price` and `availableStock >= 0`.
- **Multi-Criteria Search**: Paginated filtering by product name, category ID, and low stock threshold (`availableStock <= minimumStock`).
- **Endpoints**: `/api/v1/categories/*` and `/api/v1/products/*` (including stock updates via `PATCH /products/{id}/update-stock`).

---

## 🛠️ Technology Stack

- **Core**: Java 21 LTS
- **Framework**: Spring Boot 3.3.4
- **Security**: Spring Security, JJWT (io.jsonwebtoken: 0.12.6)
- **Persistence**: Spring Data JPA, Hibernate, PostgreSQL
- **Utilities**: Lombok, Jakarta Validation
- **Build System**: Apache Maven 3.9+
- **CI/CD**: GitHub Actions

---

## 📁 Repository Structure

```text
business-operations-platform/
├── backend/                        # Spring Boot 3.x Java Application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/asenterprises/bms/
│   │   │   │   ├── controller/    # REST API Controllers
│   │   │   │   ├── service/       # Business Logic Services
│   │   │   │   ├── repository/    # JPA Data Repositories
│   │   │   │   ├── entity/        # Domain JPA Entities
│   │   │   │   ├── dto/           # Request/Response Data Objects
│   │   │   │   ├── security/      # JWT Filters & Config
│   │   │   │   └── exception/     # Centralized Exception Handlers
│   │   │   └── resources/         # Application YML Profiles
│   └── pom.xml                    # Maven Configuration
├── frontend/                       # React Frontend Application (Target Sprint)
├── docs/                           # Architecture & Design Documentation
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── diagrams/
│   ├── proposal/
│   └── screenshots/
├── .github/                        # GitHub Workflows & Templates
│   ├── ISSUE_TEMPLATE/
│   └── workflows/
│       └── maven-build.yml
├── README.md                       # Production Documentation
├── .gitignore                      # Git Exclusion Configuration
├── LICENSE                         # MIT License
├── CONTRIBUTING.md                 # Contribution & Git Flow Guidelines
├── CHANGELOG.md                    # Release Changelog
└── CODE_OF_CONDUCT.md              # Contributor Code of Conduct
```

---

## 🚀 Backend Setup & Running

### Prerequisites
- JDK 21 installed (`java -version`)
- Maven 3.8+ installed (`mvn -version`)
- PostgreSQL database instance running

### Environment Variables
Configure database credentials or supply environment variables:
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=bms_db
export DB_USER=postgres
export DB_PASSWORD=postgres
export JWT_SECRET=your_base64_encoded_secret_key_here
```

### Running Locally
```bash
cd backend
mvn clean spring-boot:run
```
The server will start on `http://localhost:8080/api/v1`.

---

## 🌐 API Base URL & Health Check

Base Path: `http://localhost:8080/api/v1`

| Module | Endpoint | Method | Description |
|---|---|---|---|
| Auth | `/api/v1/auth/login` | `POST` | Authenticate user & obtain JWT token |
| Customers | `/api/v1/customers` | `POST` | Create a new customer |
| Customers | `/api/v1/customers/search` | `GET` | Paginated search for customers |
| Categories | `/api/v1/categories` | `POST` | Create product category |
| Products | `/api/v1/products/search` | `GET` | Filter products by name, category, low stock |
| Products | `/api/v1/products/{id}/update-stock` | `PATCH` | Direct stock update |

---

## 🔄 Development Workflow

1. Clone repository and switch to `develop` branch:
   ```bash
   git clone https://github.com/stap777/business-operations-platform.git
   git checkout develop
   ```
2. Create feature branch (`feature/feature-name`).
3. Commit using Conventional Commits (`feat: ...`, `fix: ...`).
4. Ensure `mvn clean verify` passes locally in `backend/`.
5. Open PR targeting `develop`.

---

## 🗺️ Roadmap

- [x] **Sprint 1**: Base Architecture & JPA Auditing Setup
- [x] **Sprint 2**: JWT Authentication & Security Infrastructure
- [x] **Sprint 3**: Customer Management & Code Auto-Generation
- [x] **Sprint 4**: Category & Inventory-Ready Product Module
- [ ] **Sprint 5**: Order Processing & Line Item Calculations
- [ ] **Sprint 6**: Billing, Invoicing & Payment Gateways
- [ ] **Sprint 7**: Dashboard Analytics & Executive Reports

---

## 📸 Screenshots Placeholder

*Application screenshots and architectural diagrams will be available under `docs/screenshots/` upon frontend integration.*

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
