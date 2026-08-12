package com.asenterprises.bms.service.impl;

import com.asenterprises.bms.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import org.springframework.beans.factory.ObjectProvider;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.from:noreply@asenterprises.com}")
    private String fromEmail;

    @Value("${app.mail.from-name:A.S. Enterprises BMS}")
    private String fromName;

    @Async
    @Override
    public void sendPasswordResetEmail(String toEmail, String recipientName, String resetUrl) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("JavaMailSender bean is not configured in current profile. Email delivery skipped for recipient [redacted].");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Reset Your Password - A.S. Enterprises BMS");

            String htmlBody = buildPasswordResetHtml(recipientName, resetUrl);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Password reset email successfully queued/sent to recipient [redacted]");
        } catch (Exception e) {
            log.error("Failed to send password reset email due to mail infrastructure issue: {}", e.getMessage());
        }
    }

    private String buildPasswordResetHtml(String name, String resetUrl) {
        String displayName = (name != null && !name.isBlank()) ? name : "User";
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FAFAFA; color: #111111; margin: 0; padding: 20px; }
                .container { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #ECECEC; border-radius: 12px; padding: 32px; }
                .header { text-align: center; border-bottom: 1px solid #ECECEC; padding-bottom: 20px; margin-bottom: 24px; }
                .brand { font-size: 20px; font-weight: 700; color: #111111; letter-spacing: -0.5px; }
                .content { font-size: 14px; line-height: 1.6; color: #333333; }
                .btn-wrapper { text-align: center; margin: 28px 0; }
                .btn { display: inline-block; background-color: #111111; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; }
                .footer { font-size: 12px; color: #71717A; border-top: 1px solid #ECECEC; margin-top: 32px; padding-top: 16px; text-align: center; }
                .warning { background-color: #FFFBEB; border: 1px solid #FCD34D; color: #92400E; padding: 12px; border-radius: 6px; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="brand">A.S. ENTERPRISES BMS</div>
                </div>
                <div class="content">
                  <p>Hello <strong>""" + displayName + """
                  </strong>,</p>
                  <p>A password reset request was received for your A.S. Enterprises BMS workspace account.</p>
                  <p>Click the button below to set a new password for your account. This single-use link is valid for <strong>15 minutes</strong>.</p>
                  <div class="btn-wrapper">
                    <a href=\"""" + resetUrl + """
                    " class="btn">Reset Password</a>
                  </div>
                  <p>Or copy and paste this URL into your browser:</p>
                  <p style="word-break: break-all; font-size: 12px; color: #2563EB;">""" + resetUrl + """
                  </p>
                  <div class="warning">
                    If you did not request a password reset, please ignore this message or notify your system administrator immediately.
                  </div>
                </div>
                <div class="footer">
                  &copy; A.S. Enterprises BMS. All rights reserved.
                </div>
              </div>
            </body>
            </html>
            """;
    }
}
