package com.asenterprises.bms.repository;

import com.asenterprises.bms.entity.BusinessSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * JPA Repository for singleton BusinessSettings entity configuration.
 */
@Repository
public interface BusinessSettingsRepository extends JpaRepository<BusinessSettings, Long> {

    Optional<BusinessSettings> findFirstByOrderByIdAsc();
}
