package model.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import model.dto.OrderDTO;
import model.dto.UserAccountDTO;
import model.service.OrderService;
import model.service.UserAccountService;
import utils.JwtUtil;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/staff/viewOrdersByCustomerId")
public class ViewOrderByCustomerIdController extends HttpServlet {

    private final OrderService orderService = new OrderService();
    private final UserAccountService userService = new UserAccountService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            // Extract token and get userId from JWT
            String token = JwtUtil.extractToken(req);
            int requestingUserId = JwtUtil.extractUserId(token);
            
            // Get the requesting user's details to check permissions
            UserAccountDTO requestingUser = userService.getDealerStaffById(requestingUserId);
            
            if (requestingUser == null) {
                ResponseUtils.error(resp, "User not found");
                return;
            }
            
            // Extract customerId from request parameters
            Map<String, Object> params = RequestUtils.extractParams(req);
            Object idObj = params.get("customerId");
            String idParam = (idObj == null) ? null : idObj.toString();

            if (idParam == null || idParam.trim().isEmpty()) {
                ResponseUtils.error(resp, "Customer ID is required");
                return;
            }

            int customerId;
            try {
                customerId = Integer.parseInt(idParam);
            } catch (NumberFormatException e) {
                ResponseUtils.error(resp, "Invalid customer ID format");
                return;
            }
            
            // Authorization check: Staff (role 2 or 3) can view any customer's orders
            // Customers can only view their own orders
            if (requestingUser.getRoleId() != 2 && requestingUser.getRoleId() != 3) {
                // If not staff, verify they're requesting their own orders
                if (requestingUserId != customerId) {
                    ResponseUtils.error(resp, "Unauthorized: You can only view your own orders");
                    return;
                }
            }

            // Get dealerId from the requesting user
            int dealerId = requestingUser.getDealerId();
            
            // Call the service to retrieve the list of orders
            List<OrderDTO> orderList = orderService.HandlingGetOrdersByCustomerId(customerId, dealerId);

            if (orderList != null && !orderList.isEmpty()) {
                String message = requestingUserId == customerId 
                    ? "Your orders retrieved successfully" 
                    : "Customer orders retrieved successfully";
                ResponseUtils.success(resp, message, orderList);
            } else if (orderList != null) {
                String message = requestingUserId == customerId 
                    ? "No orders found for your account" 
                    : "No orders found for customer ID: " + customerId;
                ResponseUtils.success(resp, message, orderList);
            } else {
                ResponseUtils.error(resp, "Failed to retrieve orders");
            }

        } catch (utils.AuthException e) {
            ResponseUtils.error(resp, "Authentication failed: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "An unexpected error occurred while viewing orders: " + e.getMessage());
        }
    }
}