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
import java.util.List;
import java.util.Map;
import model.service.PaymentService;
import utils.JwtUtil;
import utils.ResponseUtils;

/**
 *
 * @author ACER
 */
@WebServlet("/api/staff/getCustomerDebt")
public class getCustomerDebSummaryByDealerController extends HttpServlet {
    private final  PaymentService PS = new PaymentService();
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
          
            String token = JwtUtil.extractToken(req);
            if (token == null || token.isEmpty()) {
                ResponseUtils.error(resp, "Missing or invalid token");
                return;
            }

            int userId = JwtUtil.extractUserId(token);
            if (userId <= 0) {
                ResponseUtils.error(resp, "Invalid user ID from token");
                return;
            }

         
            int dealerId = JwtUtil.extractUserId(token);
            if (dealerId <= 0) {
                ResponseUtils.error(resp, "Dealer ID not found or unauthorized");
                return;
            }

           
            List<Map<String, Object>> customerDebts = PS.getCustomerDebtSummaryByDealer(dealerId);

            if (customerDebts == null || customerDebts.isEmpty()) {
                ResponseUtils.success(resp, "No active installment debts found for this dealer", customerDebts);
                return;
            }

            
            ResponseUtils.success(resp, "Customer debt summary retrieved successfully", customerDebts);

        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error retrieving customer debt summary: " + e.getMessage());
        }
    }
}
