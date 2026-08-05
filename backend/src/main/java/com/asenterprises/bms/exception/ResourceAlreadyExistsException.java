package com.asenterprises.bms.exception;

/**
 * Exception thrown when creating or updating a resource violates uniqueness constraints (e.g. duplicate phone number).
 */
public class ResourceAlreadyExistsException extends RuntimeException {

    public ResourceAlreadyExistsException(String message) {
        super(message);
    }
}
