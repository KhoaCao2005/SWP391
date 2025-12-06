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
import model.service.OrderService;
import utils.ResponseUtils;


/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/getCompanyMonthlyBreakdown")
public class GetCompanyMonthlyBreakdownController extends HttpServlet {
    
    private final OrderService orderService = new OrderService();
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            // Get year parameter (optional, default to current year)
            String yearParam = req.getParameter("year");
            
            Integer year = null;
            if (yearParam != null && !yearParam.isEmpty()) {
                year = Integer.parseInt(yearParam);
            } else {
                year = java.time.Year.now().getValue();
            }
            
            // Get company monthly breakdown
            List<Map<String, Object>> monthlyBreakdown = orderService.getCompanyMonthlyBreakdown(year);
            
            if (monthlyBreakdown != null && !monthlyBreakdown.isEmpty()) {
                ResponseUtils.success(resp, "Company monthly breakdown for year " + year + " retrieved successfully", monthlyBreakdown);
            } else {
                ResponseUtils.success(resp, "No monthly sales data found for year " + year, monthlyBreakdown);
            }
            
        } catch (NumberFormatException e) {
            ResponseUtils.error(resp, "Invalid year format: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "An unexpected error occurred: " + e.getMessage());
        }
    }
}
