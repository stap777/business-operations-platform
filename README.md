# Business Operations Platform (BMS)

[![Java CI/CD Build](https://github.com/stap777/business-operations-platform/actions/workflows/maven-build.yml/badge.svg)](https://github.com/stap777/business-operations-platform/actions/workflows/maven-build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java Version](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://www.oracle.com/java/)

A production-grade Business Operations and Resource Management System built with Spring Boot 3, Java 21, PostgreSQL, and Spring Security with JWT authentication. Designed for enterprise inventory tracking, customer lifecycle management, and order processing workflows.

---

## Table of Contents

- [Business Problem](#business-problem)
- [Solution Overview](#solution-overview)
- [System Architecture](#system-architecture)
- [Current Features](#current-features)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Backend Setup & Running](#backend-setup--running)
- [API Documentation](#api-documentation)
- [Development & Git Workflow](#development--git-workflow)
- [Roadmap](#roadmap)
- [License](#license)

---

## Business Problem

Distribution enterprises and wholesale suppliers often face operational bottlenecks caused by fragmented business software:
- **Uncoordinated Customer Tracking**: Inconsistent client profiles, duplicate phone entries, and lack of customer status tracking.
- **Inventory Discrepancies**: Manual stock management leads to stockouts, inaccurate valuations, and price mismatches between purchase costs and selling prices.
- **Security and Authorization Risks**: Unprotected application endpoints without role-based access control or audit logging.

---

## Solution Overview

The Business Operations Platform provides an integrated RESTful backend that unifies core business operations:
1. **Stateless Security Core**: Role-Based Access Control (RBAC) using JWT tokens and BCrypt password encryption.
2. **Customer Lifecycle Management**: Automated customer code generation (`CUST-0001`), mobile validation, and status tracking.
3. **Category and Product Catalog**: Hierarchical product classification, price guardrails (`Selling Price >= Purchase Price`), stock tracking (`availableStock`), and service item support (`trackInventory`).
4. **Order Processing Engine**: Line item price snapshotting, automated subtotal/total calculations, and delivery person role enforcement.

---

## System Architecture

The application implements a standard Layered Architecture (`Controller -> Service -> Repository -> Entity / DTO`):

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

## Current Features

### 1. Authentication Module
- **Stateless JWT Security**: HMAC-SHA signed JWT generation with 24-hour expiration TTL.
- **Role-Based Access Control (RBAC)**: Enforces access for `ADMIN`, `MANAGER`, and `DELIVERY` roles.
- **First Login Password Change**: Mandatory password rotation flag (`firstLogin`).
- **Endpoint**: `POST /api/v1/auth/login`

### 2. Customer Management Module
- **Code Generation**: Sequential customer codes (`CUST-0001`, `CUST-0002`).
- **Validation**: Indian mobile number validation (`^[6-9]\d{9}$`) and duplicate phone prevention.
- **Paginated Search**: Case-insensitive search across name and phone fields.
- **Dropdown API**: Selection endpoint for order forms (`GET /api/v1/customers/dropdown`).
- **Endpoints**: `/api/v1/customers` (CRUD, Search, Dropdown, Deactivate).

### 3. Category & Product Module
- **Category Hierarchy**: Category creation, updates, and active product dependency checks prior to deactivation.
- **Inventory Units**: Measurement units (`BARREL`, `BOTTLE`, `BOX`, `PCS`).
- **Inventory Tracking Flag**: `trackInventory` support for physical items vs. service items.
- **Price & Stock Guardrails**: Enforces `Selling Price >= Purchase Price` and `availableStock >= 0`.
- **Multi-Criteria Search**: Paginated filtering by name, category ID, and low stock threshold (`availableStock <= minimumStock`).
- **Endpoints**: `/api/v1/categories/*` and `/api/v1/products/*`.

### 4. Order Management Module
- **Order Headers & Line Items**: `Order` and `OrderItem` relationship with cascade persistence.
- **Automated Pricing**: Historical selling price snapshot per item, `lineTotal` calculation (`quantity × sellingPrice`), `subtotal`, optional `discountAmount`, and `totalAmount`.
- **Delivery Role Enforcement**: Restricts assigned delivery personnel to users with the `DELIVERY` role.
- **Status Lifecycle**: Tracks `OrderStatus` (`CREATED`, `ASSIGNED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `VERIFIED`, `COMPLETED`, `CANCELLED`), `PaymentStatus`, and `DeliveryStatus`.
- **Endpoints**: `/api/v1/orders` (Create, View by ID, Paginated Search, Cancel).

---

## Technology Stack

- **Language**: Java 21 LTS
- **Framework**: Spring Boot 3.3.4
- **Security**: Spring Security, JJWT (0.12.6)
- **Persistence**: Spring Data JPA, Hibernate, PostgreSQL
- **Utilities**: Lombok, Jakarta Validation
- **Build Tool**: Apache Maven 3.9+
- **CI/CD**: GitHub Actions

---

## Repository Structure

```text
business-operations-platform/
├── backend/                        # Spring Boot Java Application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/asenterprises/bms/
│   │   │   │   ├── controller/    # REST API Controllers
│   │   │   │   ├── service/       # Business Logic Services
│   │   │   │   ├── repository/    # JPA Repositories
│   │   │   │   ├── entity/        # JPA Entities
│   │   │   │   ├── dto/           # Data Transfer Objects
│   │   │   │   ├── security/      # Security Config & JWT Filters
│   │   │   │   └── exception/     # Exception Handlers
│   │   │   └── resources/         # Application Configuration YMLs
│   └── pom.xml                    # Maven POM File
├── frontend/                       # React Frontend Application
├── docs/                           # Documentation
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── diagrams/
│   ├── proposal/
│   └── screenshots/
├── .github/                        # GitHub Templates & CI Workflows
│   ├── ISSUE_TEMPLATE/
│   └── workflows/
│       └── maven-build.yml
├── README.md                       # Project Overview
├── .gitignore                      # Git Ignore Rules
├── LICENSE                         # MIT License
├── CONTRIBUTING.md                 # Contribution Guidelines
├── CHANGELOG.md                    # Release Notes
└── CODE_OF_CONDUCT.md              # Code of Conduct
```

---

## Backend Setup & Running

### Prerequisites
- Java Development Kit (JDK) 21
- Apache Maven 3.8+
- PostgreSQL database instance

### Environment Configuration
Set the required database and JWT environment variables:
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=bms_db
export DB_USER=postgres
export DB_PASSWORD=postgres
export JWT_SECRET=your_base64_encoded_secret_key_here
```

### Build and Run
```bash
cd backend
mvn clean spring-boot:run
```
The application starts at `http://localhost:8080/api/v1`.

---

## API Documentation

Base Path: `http://localhost:8080/api/v1`

| Module | Endpoint | Method | Description |
|---|---|---|---|
| Auth | `/api/v1/auth/login` | `POST` | User authentication & JWT token generation |
| Customers | `/api/v1/customers` | `POST` | Register customer |
| Customers | `/api/v1/customers/search` | `GET` | Search customers |
| Categories | `/api/v1/categories` | `POST` | Create category |
| Products | `/api/v1/products/search` | `GET` | Search products |
| Products | `/api/v1/products/{id}/update-stock` | `PATCH` | Update available stock |
| Orders | `/api/v1/orders` | `POST` | Create order with line items |
| Orders | `/api/v1/orders/search` | `GET` | Search orders by number, customer, status, date |
| Orders | `/api/v1/orders/{id}/cancel` | `PATCH` | Cancel order |

---

## Development & Git Workflow

1. Clone the repository and checkout `develop`:
   ```bash
   git clone https://github.com/stap777/business-operations-platform.git
   git checkout develop
   ```
2. Create a feature branch (`feature/feature-name`).
3. Follow Conventional Commits format (`feat: ...`, `fix: ...`).
4. Run local Maven verification before committing:
   ```bash
   cd backend
   mvn clean verify
   ```
5. Submit a pull request targeting `develop`.

---

## Roadmap

- [x] **Sprint 1**: Base Architecture and JPA Auditing
- [x] **Sprint 2**: JWT Authentication and Security Infrastructure
- [x] **Sprint 3**: Customer Management Module
- [x] **Sprint 4**: Category and Inventory-Ready Product Module
- [x] **Sprint 5A**: Order Processing and Line Item Calculation
- [ ] **Sprint 5B**: Inventory Movement Logs and Stock Reservation
- [ ] **Sprint 6**: Invoicing and Payment Gateway Integration
- [ ] **Sprint 7**: Reporting and Executive Analytics

---

## Screenshots

*Application screenshots and architectural diagrams will be published under `docs/screenshots/` upon frontend integration.*

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
