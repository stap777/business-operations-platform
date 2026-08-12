package com.asenterprises.bms.service;

public interface EmailService {

    void sendPasswordResetEmail(String toEmail, String recipientName, String resetUrl);
}
