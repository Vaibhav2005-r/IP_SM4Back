package com.example.demo.controller;

import com.example.demo.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private NotificationService notificationService;

    @PostMapping("/low-stock")
    public ResponseEntity<?> triggerLowStockAlert(@RequestBody Map<String, Object> payload) {
        String productName = (String) payload.get("productName");
        int currentStock = (Integer) payload.get("currentStock");
        int requiredQty = 50; // Default reorder quantity

        notificationService.triggerLowStockAlert(productName, currentStock, requiredQty);
        return ResponseEntity.ok().body(Map.of("status", "success", "message", "Alerts triggered successfully for " + productName));
    }
}
