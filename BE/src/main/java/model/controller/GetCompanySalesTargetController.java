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
import model.service.OrderService;
import utils.ResponseUtils;


/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/getCompanySalesTarget")
public class GetCompanySalesTargetController extends HttpServlet {
    
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
            
            // Get company yearly sales target
            Map<String, Object> salesTarget = orderService.getCompanyYearlySalesTarget(year);
            
            if (salesTarget != null && (int) salesTarget.get("totalCars") > 0) {
                ResponseUtils.success(resp, "Company sales target for year " + year + " retrieved successfully", salesTarget);
            } else {
                ResponseUtils.success(resp, "No approved sales found for year " + year, salesTarget);
            }
            
        } catch (NumberFormatException e) {
            ResponseUtils.error(resp, "Invalid year format: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "An unexpected error occurred: " + e.getMessage());
        }
    }
}
