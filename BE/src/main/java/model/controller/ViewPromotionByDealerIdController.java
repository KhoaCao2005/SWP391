/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package model.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import model.dto.DealerDTO;
import model.dto.UserAccountDTO;
import model.service.PromotionForDealerService;
import model.service.UserAccountService;
import utils.JwtUtil;
import utils.ResponseUtils;

/**
 *
 * @author ACER
 */
@WebServlet("/api/staff/viewPromotionDealerId")
public class ViewPromotionByDealerIdController extends HttpServlet {
    private final PromotionForDealerService promotionService = new PromotionForDealerService();
    private final UserAccountService userAccountService = new UserAccountService();
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            // Extract token and get dealer staff ID from JWT
            String token = JwtUtil.extractToken(req);
            int dealerStaffId = JwtUtil.extractUserId(token);
            
            // Get dealer staff user account using service layer
            UserAccountDTO staff = userAccountService.getDealerStaffById(dealerStaffId);
            
            if (staff == null) {
                ResponseUtils.error(resp, "Staff account not found");
                return;
            }
            
            // Get dealer ID from staff account
            int dealerId = staff.getDealerId();
            
            if (dealerId <= 0) {
                ResponseUtils.error(resp, "No dealer associated with this staff account");
                return;
            }
            
            // Get dealer with promotions using service layer
            DealerDTO dealer = promotionService.HandlingViewPromotionForDealer(dealerId);
            
            if (dealer != null) {
                ResponseUtils.success(resp, "Promotions retrieved successfully", dealer);
            } else {
                ResponseUtils.error(resp, "Dealer not found or no promotions available");
            }
            
        } catch (utils.AuthException e) {
            ResponseUtils.error(resp, "Authentication failed: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "An error occurred while retrieving promotions: " + e.getMessage());
        }
    }
}