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
import java.util.List;
import java.io.IOException;
import model.dto.CustomerDTO;
import model.dto.UserAccountDTO;
import model.service.CustomerService;
import model.service.UserAccountService;
import utils.JwtUtil;
import utils.ResponseUtils;


/**
 *
 * @author Admin
 */
@WebServlet("/api/staff/viewCustomersByDealer")
public class ViewCustomersByDealerController extends HttpServlet {
    private final UserAccountService userService = new UserAccountService();
    private final CustomerService customerService = new CustomerService();
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            String token = JwtUtil.extractToken(req);
            
            if (token == null || token.trim().isEmpty()) {
                ResponseUtils.error(resp, "No authentication token provided");
                return;
            }
            
            int userId;
            try {
                userId = JwtUtil.extractUserId(token);
            } catch (Exception e) {
                ResponseUtils.error(resp, "Invalid or expired token");
                return;
            }
            
            System.out.println("DEBUG: ViewCustomersByDealer - userId from token: " + userId);
            
            UserAccountDTO user = userService.getDealerStaffById(userId);
            
            if (user == null) {
                ResponseUtils.error(resp, "User not found with ID: " + userId);
                return;
            }
            
            int dealerId = user.getDealerId();
            
            if (dealerId <= 0) {
                ResponseUtils.error(resp, "Invalid dealer ID for user: " + userId);
                return;
            }
            
            System.out.println("DEBUG: ViewCustomersByDealer - dealerId: " + dealerId);
            
            List<CustomerDTO> customerList = customerService.getCustomersByDealer(dealerId);
            
            if (customerList != null && !customerList.isEmpty()) {
                System.out.println("DEBUG: Found " + customerList.size() + " customers for dealer " + dealerId);
                ResponseUtils.success(resp, 
                    "Successfully retrieved " + customerList.size() + " customer(s) from dealer", 
                    customerList);
            } else {
                System.out.println("DEBUG: No customers found for dealer " + dealerId);
                ResponseUtils.success(resp, 
                    "No customers found for dealer ID: " + dealerId, 
                    new java.util.ArrayList<>()); // Return empty list instead of null
            }
            
        } catch (utils.AuthException e) {
            System.err.println("ERROR: Authentication failed - " + e.getMessage());
            ResponseUtils.error(resp, "Authentication failed: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("ERROR: Exception in ViewCustomersByDealer - " + e.getMessage());
            e.printStackTrace();
            ResponseUtils.error(resp, "Error retrieving customers: " + e.getMessage());
        }
    }

}
