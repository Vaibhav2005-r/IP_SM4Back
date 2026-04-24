package com.example.demo.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    @Value("${twilio.account.sid:DISABLED}")
    private String twilioSid;

    @Value("${twilio.auth.token:DISABLED}")
    private String twilioAuthToken;

    @Value("${twilio.sandbox.number:whatsapp:+14155238886}")
    private String twilioSandboxNumber;

    @Value("${twilio.target.number:DISABLED}")
    private String targetNumber;

    @Value("${spring.mail.username:DISABLED}")
    private String senderEmail;

    @Value("${alert.recipient.email:${spring.mail.username:DISABLED}}")
    private String recipientEmail;

    @Autowired
    private JavaMailSender mailSender;

    private boolean twilioEnabled = false;
    private boolean emailEnabled  = false;

    @PostConstruct
    public void init() {
        // Twilio — only init if real credentials are present
        if (!twilioSid.equals("DISABLED") && !twilioSid.startsWith("YOUR")) {
            try {
                com.twilio.Twilio.init(twilioSid, twilioAuthToken);
                twilioEnabled = true;
                System.out.println("✅ Twilio WhatsApp alerts: ENABLED");
            } catch (Exception e) {
                System.err.println("⚠️  Twilio init failed: " + e.getMessage());
            }
        } else {
            System.out.println("ℹ️  Twilio: Skipped (no credentials configured)");
        }

        // Email — only enable if Gmail credentials are provided
        emailEnabled = !senderEmail.equals("DISABLED") && !senderEmail.startsWith("YOUR");
        System.out.println(emailEnabled ? "✅ Email alerts: ENABLED" : "ℹ️  Email alerts: Skipped (no credentials)");
    }

    public void triggerLowStockAlert(String productName, int currentStock, int threshold) {
        System.out.printf("🚨 LOW STOCK: %s — %d units remaining (threshold: %d)%n",
                productName, currentStock, threshold);

        String subject = "🚨 Low Stock Alert — " + productName;
        String body = "⚠️  VAULT AI — Low Stock Notification\n\n" +
                      "Product  : " + productName + "\n" +
                      "Stock    : " + currentStock + " units remaining\n" +
                      "Threshold: " + threshold + " units\n\n" +
                      "Immediate restock recommended.\n\n" +
                      "— Vault AI Inventory Engine";

        // 1. WhatsApp via Twilio
        if (twilioEnabled) {
            try {
                com.twilio.rest.api.v2010.account.Message.creator(
                        new com.twilio.type.PhoneNumber(targetNumber),
                        new com.twilio.type.PhoneNumber(twilioSandboxNumber),
                        body
                ).create();
                System.out.println("✅ WhatsApp alert sent for: " + productName);
            } catch (Exception e) {
                System.err.println("❌ WhatsApp send failed: " + e.getMessage());
            }
        }

        // 2. Email via Gmail SMTP
        if (emailEnabled) {
            try {
                SimpleMailMessage email = new SimpleMailMessage();
                email.setFrom(senderEmail);
                email.setTo(recipientEmail);
                email.setSubject(subject);
                email.setText(body);
                mailSender.send(email);
                System.out.println("✅ Email alert sent for: " + productName);
            } catch (Exception e) {
                System.err.println("❌ Email send failed: " + e.getMessage());
            }
        }
    }
}
