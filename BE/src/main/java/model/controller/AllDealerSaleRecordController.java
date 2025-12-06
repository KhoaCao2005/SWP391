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
import model.service.SaleRecordService;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/dealerSaleRecords")
public class AllDealerSaleRecordController extends HttpServlet {

    private SaleRecordService saleService = new SaleRecordService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(request);
            
            // Extract optional date range parameters
            String startDate = params.containsKey("startDate") ? params.get("startDate").toString() : null;
            String endDate = params.containsKey("endDate") ? params.get("endDate").toString() : null;
            
            // Get dealer sales summary with optional date filtering
            List<Map<String, Object>> summaryList = saleService.getDealerSalesSummary(startDate, endDate);
            
            ResponseUtils.success(response, "Dealer sales summary retrieved successfully", summaryList);
            
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(response, "Failed to retrieve dealer sales summary: " + e.getMessage());
        }
    }
}
