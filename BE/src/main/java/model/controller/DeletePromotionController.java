/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package model.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import model.service.PromotionForDealerService;
import utils.JwtUtil;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/deletePromotion")
public class DeletePromotionController extends HttpServlet {
    
    private final PromotionForDealerService promotionService = new PromotionForDealerService();
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            // Verify authentication
            String token = JwtUtil.extractToken(req);
            JwtUtil.validateToken(token);
            
            // Extract promoId from request parameters
            Map<String, Object> params = RequestUtils.extractParams(req);
            
            Object idObj = params.get("promoId");
            String idParam = (idObj == null) ? null : idObj.toString();
            
            if (idParam == null || idParam.trim().isEmpty()) {
                ResponseUtils.error(resp, "Promotion ID is required");
                return;
            }
            
            int promoId;
            try {
                promoId = Integer.parseInt(idParam);
            } catch (NumberFormatException e) {
                ResponseUtils.error(resp, "Invalid promotion ID format");
                return;
            }
            
            // Call service to delete the promotion
            boolean deleted = promotionService.deletePromotion(promoId);
            
            if (deleted) {
                ResponseUtils.success(resp, "Promotion deleted successfully", null);
            } else {
                ResponseUtils.error(resp, "Promotion not found or could not be deleted");
            }
            
        } catch (utils.AuthException e) {
            ResponseUtils.error(resp, "Authentication failed: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "An unexpected error occurred while deleting promotion: " + e.getMessage());
        }
    }
}
