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
import model.dto.InstallmentPlanDTO;
import model.service.PaymentService;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/staff/updateInstallmentPlan")
public class UpdateInstallmentPlanController extends HttpServlet {

    private final PaymentService service = new PaymentService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        try {
            Map<String, Object> params = RequestUtils.extractParams(request);

            // Extract planId
            Integer planId = params.get("planId") != null
                    ? Integer.parseInt(params.get("planId").toString())
                    : null;

            // Extract status
            String status = params.get("status") != null
                    ? params.get("status").toString().toUpperCase()
                    : null;

            // Extract termMonth string
            String termMonthStr = params.get("termMonth") != null
                    ? params.get("termMonth").toString()
                    : null;

            // --- VALIDATION ---
            if (planId == null) {
                ResponseUtils.error(response, "Missing planId");
                return;
            }

            if (status == null || (!status.equals("ACTIVE") && !status.equals("PAID") && !status.equals("OVERDUE"))) {
                ResponseUtils.error(response, "Invalid status. Must be 'ACTIVE', 'PAID', or 'OVERDUE'.");
                return;
            }

            if (termMonthStr == null || termMonthStr.trim().isEmpty()) {
                ResponseUtils.error(response, "Missing termMonth");
                return;
            }

            // --- PARSE termMonth safely ---
            int termValue = parseTermMonth(termMonthStr);
            if (termValue < 0 || termValue > 12) {
                ResponseUtils.error(response, "Invalid termMonth value");
                return;
            }

            // --- BUILD DTO ---
            InstallmentPlanDTO plan = new InstallmentPlanDTO();
            plan.setPlanId(planId);
            plan.setStatus(status);
            plan.setTermMonth(String.valueOf(termValue)); // always numeric string

            // --- UPDATE VIA SERVICE ---
            InstallmentPlanDTO updatedPlan = service.updateInstallmentPlanStatus(plan);

            if (updatedPlan != null) {
                ResponseUtils.success(response, "Update successful", updatedPlan);
            } else {
                ResponseUtils.error(response, "Update failed");
            }

        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(response, "Server error: " + e.getMessage());
        }
    }

    private int parseTermMonth(String termMonth) {
        if (termMonth == null) {
            return 0;
        }

        // Remove all non-digit characters
        String digitsOnly = termMonth.replaceAll("[^0-9]", "").trim();

        if (digitsOnly.isEmpty()) {
            return 0;
        }

        try {
            return Integer.parseInt(digitsOnly);
        } catch (NumberFormatException e) {
            System.err.println("Invalid termMonth format: " + termMonth);
            return 0;
        }
    }
}
