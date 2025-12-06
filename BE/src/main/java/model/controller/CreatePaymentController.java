package model.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import model.dto.InstallmentPlanDTO;
import model.dto.PaymentDTO;
import model.service.PaymentService;
import utils.RequestUtils;
import utils.ResponseUtils;

@WebServlet("/api/staff/createPayment")
public class CreatePaymentController extends HttpServlet {

    private final PaymentService paymentService = new PaymentService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(request);

            // Validate required fields
            if (!params.containsKey("orderId") || !params.containsKey("method")) {
                ResponseUtils.error(response, "Missing required fields: orderId and method");
                return;
            }

            int orderId = Integer.parseInt(params.get("orderId").toString());
            String method = params.get("method").toString();

            // Parse promotion ID if provided
            Integer promoId = null;
            if (params.containsKey("promoId") && params.get("promoId") != null) {
                String promoIdStr = params.get("promoId").toString();
                if (!promoIdStr.trim().isEmpty()) {
                    try {
                        promoId = Integer.parseInt(promoIdStr);
                    } catch (NumberFormatException e) {
                        ResponseUtils.error(response, "Invalid promotion ID format");
                        return;
                    }
                }
            }

            // Create installment plan if not using TT (cash) method
            InstallmentPlanDTO plan = null;
            if (!"TT".equalsIgnoreCase(method)) {
                plan = new InstallmentPlanDTO();
                plan.setInterestRate(params.getOrDefault("interestRate", "0").toString());
                plan.setTermMonth(params.getOrDefault("termMonth", "12").toString());
                plan.setMonthlyPay(params.getOrDefault("monthlyPay", "0").toString());

                String status = params.getOrDefault("status", "Active").toString().toUpperCase();
                if (!status.equalsIgnoreCase("Active")
                        && !status.equalsIgnoreCase("Paid")
                        && !status.equalsIgnoreCase("Overdue")) {
                    status = "Active";
                }
                plan.setStatus(status);
            }

            // Process payment with promotion ID
            PaymentDTO result = paymentService.processPayment(orderId, method, plan, promoId);

            if (result != null) {
                ResponseUtils.success(response, "Payment processed successfully", result);
            } else {
                ResponseUtils.error(response, "Payment processing failed");
            }

        } catch (NumberFormatException e) {
            ResponseUtils.error(response, "Invalid number format: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            // Handle validation errors (invalid promotion, dates, etc.)
            ResponseUtils.error(response, e.getMessage());
        } catch (IllegalStateException e) {
            // Handle state errors (payment already exists)
            ResponseUtils.error(response, e.getMessage());
        } catch (ClassNotFoundException e) {
            ResponseUtils.error(response, "Database error: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(response, "Error: " + e.getClass().getSimpleName()
                    + (e.getMessage() != null ? (": " + e.getMessage()) : ""));
        }
    }
}
