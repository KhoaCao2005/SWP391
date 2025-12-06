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
import model.dto.OrderDTO;
import model.dto.UserAccountDTO;
import model.service.OrderService;
import model.service.UserAccountService;
import utils.JwtUtil;
import utils.ResponseUtils;


/**
 *
 * @author Admin
 */
@WebServlet("/api/staff/viewOrderFromDealer")
public class ViewOrderFromDealerController extends HttpServlet {
    private final UserAccountService userService = new UserAccountService();
    private final OrderService orderService = new OrderService();
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            // Extract token and get userId from JWT
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
            
            System.out.println("DEBUG: ViewOrderFromDealer - userId from token: " + userId);
            
            // Get user details to retrieve dealerId
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
            
            System.out.println("DEBUG: ViewOrderFromDealer - dealerId: " + dealerId);
            
            // Call the service to retrieve all orders from the dealer (customer_id = 0)
            List<OrderDTO> orderList = orderService.GetAllOrdersFromDealer(dealerId);
            
            if (orderList != null && !orderList.isEmpty()) {
                System.out.println("DEBUG: Found " + orderList.size() + " orders for dealer " + dealerId);
                ResponseUtils.success(resp, 
                    "Successfully retrieved " + orderList.size() + " order(s) from dealer (customer_id = 0)", 
                    orderList);
            } else {
                System.out.println("DEBUG: No orders found for dealer " + dealerId);
                ResponseUtils.success(resp, 
                    "No orders found for dealer ID: " + dealerId + " with customer_id = 0", 
                    new java.util.ArrayList<>()); // Return empty list instead of null
            }
            
        } catch (utils.AuthException e) {
            System.err.println("ERROR: Authentication failed - " + e.getMessage());
            ResponseUtils.error(resp, "Authentication failed: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("ERROR: Exception in ViewOrderFromDealer - " + e.getMessage());
            e.printStackTrace();
            ResponseUtils.error(resp, "Error retrieving orders: " + e.getMessage());
        }
    }

}
