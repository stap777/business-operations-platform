# Changelog

All notable changes to the Business Operations Platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v0.5.0] - 2026-08-05

### Added
- **Order Management Module**:
  - `Order` and `OrderItem` JPA entities with cascade persistence and orphan removal.
  - `OrderStatus` (`CREATED`, `ASSIGNED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `VERIFIED`, `COMPLETED`, `CANCELLED`), `PaymentStatus`, and `DeliveryStatus` enums.
  - Snapshot pricing logic capturing historical product `sellingPrice` per item at order creation.
  - Automated calculation of `lineTotal`, `subtotal`, `discountAmount`, and `totalAmount`.
  - Delivery person assignment validation restricting assigned users to active accounts with the `DELIVERY` role.
  - `OrderRepository` supporting sequential order number generation (`ORD-YYYYMMDD-XXXX`) and multi-criteria paginated search.
  - `OrderService` and `OrderController` exposing endpoints under `/api/v1/orders`.

---

## [v0.4.0] - 2026-08-05

### Added
- **Category Management Module**:
  - `Category` entity, `CategoryStatus` enum (`ACTIVE`, `INACTIVE`), and indexed `name` column.
  - `CategoryRepository` with case-insensitive name searching and status filtering.
  - Category DTOs (`CategoryRequest`, `CategoryResponse`, `CategoryDropdownResponse`).
  - `CategoryService` enforcing dependency checks (active products block category deactivation).
  - `CategoryController` exposing REST endpoints (`/api/v1/categories`).
- **Inventory-Ready Product Module**:
  - `Product` entity, `ProductStatus` enum, and `ProductUnit` enum (`BARREL`, `BOTTLE`, `BOX`, `PCS`).
  - Added `trackInventory` flag for physical and non-physical catalog items.
  - Renamed stock field to `availableStock` for future order reservation compatibility.
  - `ProductRepository` supporting multi-criteria search (name, category, low stock threshold).
  - Product DTOs (`ProductRequest`, `ProductResponse`, `ProductDropdownResponse`, `StockUpdateRequest`).
  - `ProductService` enforcing business rules (`Selling Price >= Purchase Price`, `availableStock >= 0`, `minimumStock >= 0`, unique names per category).
  - `ProductController` exposing REST endpoints (`/api/v1/products`) including stock update and dropdown endpoints.

---

## [v0.3.0] - 2026-08-05

### Added
- **Customer Management Module**:
  - `Customer` entity extending `BaseEntity` with `CustomerStatus` (`ACTIVE`, `INACTIVE`).
  - Automatic `customerCode` generation (`CUST-0001`, `CUST-0002`...).
  - Indian mobile number validation (`^[6-9]\d{9}$`) and duplicate phone prevention.
  - `CustomerRepository` with paginated case-insensitive name and phone number search.
  - `CustomerRequest`, `CustomerResponse`, and lightweight `CustomerDropdownResponse` DTOs.
  - `CustomerService` and `CustomerController` exposing CRUD endpoints under `/api/v1/customers`.

---

## [v0.2.0] - 2026-08-05

### Added
- **JWT Authentication & Security Infrastructure**:
  - Stateless authentication configuration via Spring Security `SecurityFilterChain`.
  - `JwtService` for HMAC-SHA token generation (24h TTL) and claims validation.
  - `CustomUserDetailsService` enforcing user status checks (`ACTIVE` only).
  - `User` entity extending `BaseEntity` with role-based access (`ADMIN`, `MANAGER`, `DELIVERY`).
  - First-login password rotation flag (`firstLogin`).
  - `AuthController` exposing `/api/v1/auth/login`.

---

## [v0.1.0] - 2026-07-30

### Added
- **Project Initialization**:
  - Initialized Spring Boot 3.3.4 project with Java 21 LTS and Maven build system.
  - Established `BaseEntity` with JPA auditing (`createdAt`, `updatedAt`).
  - PostgreSQL database connection configuration and environment profiles (`application-dev.yml`, `application-prod.yml`).
  - Layered package structure (`controller`, `service`, `repository`, `entity`, `dto`, `exception`).
