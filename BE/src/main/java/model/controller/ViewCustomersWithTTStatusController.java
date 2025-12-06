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

@WebServlet("/api/staff/viewCustomerWithTTStatus")
public class ViewCustomersWithTTStatusController extends HttpServlet {

    private final PaymentService paymentService = new PaymentService();
    private final UserAccountService userService = new UserAccountService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            // Extract token
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

            // Get dealer info
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

            // Get TT customers for this dealer
            List<Map<String, Object>> customers = paymentService.getCustomersWithTTStatusByDealer(dealerId);

            if (customers == null || customers.isEmpty()) {
                ResponseUtils.success(response, 
                    "No TT (direct payment) customers found for dealer ID: " + dealerId, 
                    Collections.emptyList());
            } else {
                double totalPaid = customers.stream()
                        .mapToDouble(m -> (double) m.get("paidAmount"))
                        .sum();

                ResponseUtils.success(response, 
                    "TT customers retrieved successfully (" + customers.size() + " customers, Total Paid: $" +
                    String.format("%.2f", totalPaid) + ")", 
                    customers);
            }

        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(response, "Failed to retrieve TT customers: " + e.getMessage());
        }
    }
}
