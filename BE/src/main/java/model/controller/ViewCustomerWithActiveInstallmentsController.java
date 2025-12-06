package model.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import model.dto.UserAccountDTO;
import model.service.PaymentService;
import model.service.UserAccountService;
import utils.JwtUtil;
import utils.ResponseUtils;

@WebServlet("/api/staff/viewCustomerWithActiveInstallments")
public class ViewCustomerWithActiveInstallmentsController extends HttpServlet {

    private final PaymentService paymentService = new PaymentService();
    private final UserAccountService userService = new UserAccountService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            // Extract token and get userId from JWT
            String token = JwtUtil.extractToken(request);
            
            if (token == null || token.trim().isEmpty()) {
                ResponseUtils.error(response, "No authentication token provided");
                return;
            }
            
            int userId;
            try {
                userId = JwtUtil.extractUserId(token);
            } catch (Exception e) {
                ResponseUtils.error(response, "Invalid or expired token");
                return;
            }
            
            System.out.println("DEBUG: ViewCustomerWithActiveInstallments - userId from token: " + userId);
            
            // Get user details to retrieve dealerId
            UserAccountDTO user = userService.getDealerStaffById(userId);
            
            if (user == null) {
                ResponseUtils.error(response, "User not found with ID: " + userId);
                return;
            }
            
            int dealerId = user.getDealerId();
            
            if (dealerId <= 0) {
                ResponseUtils.error(response, "Invalid dealer ID for user: " + userId);
                return;
            }
            
            System.out.println("DEBUG: ViewCustomerWithActiveInstallments - dealerId: " + dealerId);
            
            // Get customers with active installments for this dealer only
            List<Map<String, Object>> customers = paymentService.getCustomersWithActiveInstallmentsByDealer(dealerId);
            
            if (customers == null || customers.isEmpty()) {
                System.out.println("DEBUG: No active installment customers found for dealer " + dealerId);
                ResponseUtils.success(response, 
                    "No customers with active or overdue installments found for dealer ID: " + dealerId, 
                    Collections.emptyList());
            } else {
                System.out.println("DEBUG: Found " + customers.size() + " active installment customers for dealer " + dealerId);
                
                // Calculate total outstanding
                double totalOutstanding = customers.stream()
                        .mapToDouble(m -> (double) m.get("outstandingAmount"))
                        .sum();
                
                System.out.println("DEBUG: Total outstanding amount: " + totalOutstanding);
                
                ResponseUtils.success(response, 
                    "Active installment customers retrieved successfully (" + customers.size() + " customers, Total Outstanding: $" + 
                    String.format("%.2f", totalOutstanding) + ")", 
                    customers);
            }
            
        } catch (utils.AuthException e) {
            System.err.println("ERROR: Authentication failed - " + e.getMessage());
            ResponseUtils.error(response, "Authentication failed: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("ERROR: Exception in ViewCustomerWithActiveInstallments - " + e.getMessage());
            e.printStackTrace();
            ResponseUtils.error(response, "Failed to retrieve active installment customers: " + e.getMessage());
        }
    }
}
