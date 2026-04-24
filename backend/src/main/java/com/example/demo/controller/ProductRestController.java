package com.example.demo.controller;

import com.example.demo.entity.Product;
import com.example.demo.entity.StockLevel;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.StockLevelRepository;
import com.example.demo.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ims")
public class ProductRestController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockLevelRepository stockLevelRepository;

    @Autowired
    private NotificationService notificationService;

    // 1. Get all products with stock
    @GetMapping("/products")
    public ResponseEntity<?> getAllProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    // 2. Record Sales and reduce stock explicitly
    @PostMapping("/sales")
    public ResponseEntity<?> recordSale(@RequestBody Map<String, Object> saleDto) {
        String productName = (String) saleDto.get("productName");
        int qty = (Integer) saleDto.get("quantity");
        
        Optional<Product> prodOpt = productRepository.findAll().stream().filter(p -> p.getName().equals(productName)).findFirst();
        
        if (prodOpt.isPresent()) {
            Product p = prodOpt.get();
            // Fallback for missing stock mappings
            int currentStock = 50; 
            Optional<StockLevel> stockOpt = stockLevelRepository.findByProductId(p.getId());
            StockLevel stockList;
            if(stockOpt.isPresent()){
                stockList = stockOpt.get();
                currentStock = stockList.getQuantity();
            } else {
                stockList = new StockLevel();
                stockList.setProductId(p.getId());
                stockList.setQuantity(50);
            }
            
            int diff = Math.max(0, currentStock - qty);
            stockList.setQuantity(diff);
            stockLevelRepository.save(stockList);

            if(diff < 10){
                 notificationService.triggerLowStockAlert(p.getName(), diff, 50);
            }
            return ResponseEntity.ok(Map.of("message", "Sale recorded successfully!", "newStock", diff));
        }
        return ResponseEntity.badRequest().body("Product not found");
    }

    @PostMapping("/prices")
    public ResponseEntity<?> updatePrice(@RequestBody Map<String, Object> priceDto) {
        String productName = (String) priceDto.get("productName");
        String actionType = (String) priceDto.get("actionType");
        
        Optional<Product> prodOpt = productRepository.findAll().stream().filter(p -> p.getName().equals(productName)).findFirst();
        if(prodOpt.isPresent()){
            Product p = prodOpt.get();
            if(actionType.contains("INCREASE")){
                p.setPrice(p.getPrice().multiply(new java.math.BigDecimal("1.05"))); // 5% increase
            } else if (actionType.contains("DISCOUNT")) {
                p.setPrice(p.getPrice().multiply(new java.math.BigDecimal("0.90"))); // 10% discount
            }
            productRepository.save(p);
            return ResponseEntity.ok(Map.of("message", "Price applied", "newPrice", p.getPrice()));
        }
        return ResponseEntity.badRequest().body("Product not found");
    }
}
