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
import java.util.List;
import java.util.Map;
import model.dto.UserAccountDTO;
import model.service.OrderService;
import model.service.UserAccountService;
import utils.JwtUtil;
import utils.ResponseUtils;


/**
 *
 * @author Admin
 */
@WebServlet("/api/staff/viewOrdersByStaffId")
public class ViewOrderByDealerStaffIdController extends HttpServlet {
    
    private final OrderService orderService = new OrderService();
    private final UserAccountService userService = new UserAccountService();
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            // Extract token and get userId from JWT
            String token = JwtUtil.extractToken(req);
            int userId = JwtUtil.extractUserId(token);
            
            // Get user details to check role and dealer
            UserAccountDTO user = userService.getDealerStaffById(userId);
            
            if (user == null) {
                ResponseUtils.error(resp, "User not found");
                return;
            }
            
            // Call the service to retrieve the list of orders based on role
            List<Map<String, Object>> orderList = orderService.GetListOrderByDealerStaffId(
                userId, 
                user.getRoleId(), 
                user.getDealerId()
            );
            
            if (orderList != null && !orderList.isEmpty()) {
                String message = user.getRoleId() == 2 
                    ? "All dealer orders retrieved successfully" 
                    : "Your orders retrieved successfully";
                ResponseUtils.success(resp, message, orderList);
            } else {
                String message = user.getRoleId() == 2 
                    ? "No orders found for this dealer" 
                    : "No orders found for your account";
                ResponseUtils.success(resp, message, orderList);
            }
            
        } catch (utils.AuthException e) {
            ResponseUtils.error(resp, "Authentication failed: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "An unexpected error occurred: " + e.getMessage());
        }
    }
}
