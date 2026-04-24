package com.example.demo.controller;

import com.example.demo.entity.Product;
import com.example.demo.entity.StockLevel;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.StockLevelRepository;
import com.example.demo.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ims")
public class ProductRestController {

    @Autowired private ProductRepository productRepository;
    @Autowired private StockLevelRepository stockLevelRepository;
    @Autowired private NotificationService notificationService;

    // ── GET /products ─────────────────────────────────────────────────────────
    // Returns every product joined with its real stock quantity
    @GetMapping("/products")
    public ResponseEntity<?> getAllProducts() {
        List<Map<String, Object>> result = productRepository.findAll().stream().map(p -> {
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id",          p.getId());
            dto.put("name",        p.getName());
            dto.put("category",    p.getCategory());
            dto.put("price",       p.getPrice());
            dto.put("description", p.getDescription());
            int qty = stockLevelRepository.findByProductId(p.getId())
                          .map(StockLevel::getQuantity).orElse(0);
            dto.put("stock", qty);
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── POST /products ─────────────────────────────────────────────────────────
    @PostMapping("/products")
    public ResponseEntity<?> createProduct(@RequestBody Product newProduct) {
        Product saved = productRepository.save(newProduct);
        StockLevel sl = new StockLevel();
        sl.setProductId(saved.getId());
        sl.setQuantity(0);
        stockLevelRepository.save(sl);

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id",       saved.getId());
        dto.put("name",     saved.getName());
        dto.put("category", saved.getCategory());
        dto.put("price",    saved.getPrice());
        dto.put("stock",    0);
        return ResponseEntity.ok(dto);
    }

    // ── POST /sales ────────────────────────────────────────────────────────────
    // Deducts stock and fires email alert if quantity falls below threshold
    @PostMapping("/sales")
    public ResponseEntity<?> recordSale(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("productName");
        int qty = Integer.parseInt(String.valueOf(body.get("quantity")));

        Optional<Product> prodOpt = productRepository.findAll().stream()
                .filter(p -> p.getName().equals(name)).findFirst();

        if (prodOpt.isEmpty()) return ResponseEntity.badRequest().body("Product not found");

        Product p = prodOpt.get();
        StockLevel sl = stockLevelRepository.findByProductId(p.getId()).orElseGet(() -> {
            StockLevel s = new StockLevel(); s.setProductId(p.getId()); s.setQuantity(0); return s;
        });

        int newStock = Math.max(0, sl.getQuantity() - qty);
        sl.setQuantity(newStock);
        stockLevelRepository.save(sl);

        int threshold = sl.getLowStockThreshold() != null ? sl.getLowStockThreshold() : 20;
        if (newStock < threshold) {
            notificationService.triggerLowStockAlert(p.getName(), newStock, threshold);
        }

        return ResponseEntity.ok(Map.of("message", "Sale recorded!", "newStock", newStock));
    }

    // ── POST /restock ──────────────────────────────────────────────────────────
    @PostMapping("/restock")
    public ResponseEntity<?> addStock(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("productName");
        int qty = Integer.parseInt(String.valueOf(body.get("quantity")));

        Optional<Product> prodOpt = productRepository.findAll().stream()
                .filter(p -> p.getName().equals(name)).findFirst();

        if (prodOpt.isEmpty()) return ResponseEntity.badRequest().body("Product not found");

        Product p = prodOpt.get();
        StockLevel sl = stockLevelRepository.findByProductId(p.getId()).orElseGet(() -> {
            StockLevel s = new StockLevel(); s.setProductId(p.getId()); s.setQuantity(0); return s;
        });
        int newAmount = sl.getQuantity() + qty;
        sl.setQuantity(newAmount);
        stockLevelRepository.save(sl);
        return ResponseEntity.ok(Map.of("message", "Restocked!", "newStock", newAmount));
    }

    // ── POST /prices ───────────────────────────────────────────────────────────
    @PostMapping("/prices")
    public ResponseEntity<?> updatePrice(@RequestBody Map<String, Object> body) {
        String name       = (String) body.get("productName");
        String actionType = (String) body.get("actionType");

        Optional<Product> prodOpt = productRepository.findAll().stream()
                .filter(p -> p.getName().equals(name)).findFirst();

        if (prodOpt.isEmpty()) return ResponseEntity.badRequest().body("Product not found");

        Product p = prodOpt.get();
        if      (actionType.contains("INCREASE")) p.setPrice(p.getPrice().multiply(new java.math.BigDecimal("1.05")));
        else if (actionType.contains("DISCOUNT")) p.setPrice(p.getPrice().multiply(new java.math.BigDecimal("0.90")));

        productRepository.save(p);
        return ResponseEntity.ok(Map.of("message", "Price updated", "newPrice", p.getPrice()));
    }
}
