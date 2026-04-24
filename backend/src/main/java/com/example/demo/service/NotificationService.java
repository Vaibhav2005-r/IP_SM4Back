package com.example.demo.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    @Value("${twilio.account.sid}")
    private String twilioSid;

    @Value("${twilio.auth.token}")
    private String twilioAuthToken;

    @Value("${twilio.sandbox.number}")
    private String twilioSandboxNumber;

    @Value("${twilio.target.number}")
    private String targetNumber;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Autowired
    private JavaMailSender mailSender;

    @PostConstruct
    public void init() {
        Twilio.init(twilioSid, twilioAuthToken);
    }

    public void triggerLowStockAlert(String productName, int currentStock, int requiredQty) {
        String alertMessage = "🚨 Low Stock Alert 🚨\\n\\nProduct: " + productName + "\\nCurrent Stock: " + currentStock + "\\nRequired Quantity to Reorder: " + requiredQty;
        
        System.out.println("Triggering Phase 4 Integrations for: " + productName);
        
        // 1. Send Twilio WhatsApp Alert
        try {
            Message message = Message.creator(
                    new PhoneNumber(targetNumber),
                    new PhoneNumber(twilioSandboxNumber),
                    alertMessage
            ).create();
            System.out.println("WhatsApp Alert Sent! SID: " + message.getSid());
        } catch (Exception e) {
            System.err.println("Failed to send WhatsApp alert: " + e.getMessage());
        }

        // 2. Send Email Alert
        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setFrom(senderEmail);
            email.setTo(senderEmail); // Sending to self as an admin alert
            email.setSubject("🚨 URGENT: Low Stock Alert - " + productName);
            email.setText(alertMessage);
            mailSender.send(email);
            System.out.println("Email Alert Sent Successfully!");
        } catch (Exception e) {
            System.err.println("Failed to send Email alert: " + e.getMessage());
        }
    }
}
