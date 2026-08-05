package com.asenterprises.bms.exception;

/**
 * Exception thrown when a requested domain resource is not found in the database.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
