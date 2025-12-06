/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package model.service;

import static jakarta.json.bind.JsonbConfig.DATE_FORMAT;
import java.sql.SQLException;
import java.text.ParseException;
import java.util.Date;
import java.util.List;
import java.util.Map;
import model.dao.DealerDAO;
import model.dao.DealerPromotionDAO;
import model.dao.PromotionDAO;
import model.dto.DealerDTO;
import model.dto.PromotionDTO;

/**
 *
 * @author ACER
 */
public class PromotionForDealerService {

    private DealerDAO dealerDAO = new DealerDAO();
    private DealerPromotionDAO dealerPromotionDAO = new DealerPromotionDAO();
    private PromotionDAO promotionDAO = new PromotionDAO();

    public DealerDTO HandlingViewPromotionForDealer(int dealerId) {
        DealerDTO dealer = dealerDAO.GetDealerById(dealerId);
        if (dealer == null) {
            return null;
        }

        try {
            List<PromotionDTO> promotions = dealerPromotionDAO.getPromotionsByDealerId(dealerId);
            dealer.setPromotion(promotions);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }

        return dealer;
    }

    public boolean createPromotionForDealer(int promoId, int dealerId) {
        if (promoId <= 0 || dealerId <= 0) {
            throw new IllegalArgumentException("Invalid promoId or dealerId");
        }
        return dealerPromotionDAO.createPromotionForDealer(promoId, dealerId);
    }

    public boolean updatePromotionForDealer(int promoId, int dealerId, int newPromoId) {
        if (promoId <= 0 || dealerId <= 0 || newPromoId <= 0) {
            throw new IllegalArgumentException("Invalid promoId, dealerId, or newPromoId");
        }
        return dealerPromotionDAO.updatePromotionForDealer(promoId, dealerId, newPromoId);
    }

    public List<Map<String, Object>> getAllPromotionsWithDealers() {
        return dealerPromotionDAO.getAllPromotionsWithDealers();
    }
    
    public List<DealerDTO> getAllDealers(){
        return dealerDAO.getAllDealers();
    }

    public PromotionDTO createPromotion(PromotionDTO promotion) throws SQLException, ClassNotFoundException {
        // Validate dữ liệu
        String validationError = validatePromotion(promotion);
        if (validationError != null) {
            System.err.println("Validation Error: " + validationError);
            return null;
        }

        // Kiểm tra trùng lặp
        if (isDuplicatePromotion(promotion)) {
            System.err.println("Promotion is already exists.");
            return null;
        }

        return promotionDAO.create(promotion);
    }
    
    public boolean deletePromotion(int promoId) {
        try {
            // Check if promotion exists before deleting
            List<PromotionDTO> promotionList = promotionDAO.GetPromotionById(promoId);
            if (promotionList == null || promotionList.isEmpty()) {
                return false;
            }
            
            return promotionDAO.deletePromotion(promoId);
        } catch (SQLException | ClassNotFoundException e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<PromotionDTO> getPromotionById(int promoId) {
        return promotionDAO.GetPromotionById(promoId);
    }
    
    public List<PromotionDTO> getAllPromotion() {
        return promotionDAO.GetAllPromotion();
    }

    private String validatePromotion(PromotionDTO promotion) {
        if (promotion == null) {
            return "Promotion cannot be null";
        }

        if (promotion.getDescription() == null || promotion.getDescription().trim().isEmpty()) {
            return "Description cannot be empty";
        }

        if (promotion.getStartDate() == null || promotion.getEndDate() == null
                || promotion.getStartDate().trim().isEmpty() || promotion.getEndDate().trim().isEmpty()) {
            return "Start date and end date cannot be empty";
        }

        // Simple format check (yyyy-MM-dd)
        if (!promotion.getStartDate().matches("\\d{4}-\\d{2}-\\d{2}")
                || !promotion.getEndDate().matches("\\d{4}-\\d{2}-\\d{2}")) {
            return "Invalid date format (required: yyyy-MM-dd)";
        }

        // (Optional) Lexical comparison since yyyy-MM-dd is sortable as strings
        if (promotion.getEndDate().compareTo(promotion.getStartDate()) < 0) {
            return "End date must be after start date";
        }

        if (promotion.getDiscountRate() == null || promotion.getDiscountRate().trim().isEmpty()) {
            return "Discount rate cannot be empty";
        }

        try {
            double rate = Double.parseDouble(promotion.getDiscountRate());
            String type = promotion.getType();

            if ("PERCENTAGE".equalsIgnoreCase(type)) {
                if (rate < 0 || rate > 1) {
                    return "Discount rate must be between 0 and 1 (0% - 100%)";
                }
            } else if ("FIXED".equalsIgnoreCase(type)) {
                if (rate < 0) {
                    return "Discount value cannot be negative";
                }
            } else {
                return "Promotion type must be PERCENTAGE or FIXED";
            }
        } catch (NumberFormatException e) {
            return "Invalid discount rate";
        }

        return null;
    }
    
    private boolean isDuplicatePromotion(PromotionDTO promotion) {
        List<PromotionDTO> allPromotions = promotionDAO.GetAllPromotion();
        if (allPromotions == null) return false;
        
        String startDate = promotion.getStartDate();
        String endDate = promotion.getEndDate();
        
        for (PromotionDTO existing : allPromotions) {
            if (existing.getPromoId() == promotion.getPromoId()) {
                continue;
            }
            
            String existingStart = existing.getStartDate();
            String existingEnd = existing.getEndDate();
            
            boolean hasOverlap = !(endDate.compareTo(existingStart) < 0 || 
                                   startDate.compareTo(existingEnd) > 0);
            
            if (hasOverlap && existing.getDescription().equalsIgnoreCase(promotion.getDescription())) {
                return true;
            }
        }
        
        return false;
    }

}
