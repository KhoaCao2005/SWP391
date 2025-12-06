/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package model.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import model.dto.FeedbackDTO;
import model.service.FeedBackService;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author ACER
 */
@WebServlet("/api/staff/createFeedBack")
public class CreateFeedBackController extends HttpServlet {

    private final FeedBackService CFBService = new FeedBackService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(req);

            String customerIdStr = params.get("customer_id").toString();
            String orderIdStr = params.get("order_id").toString();
            String type = params.get("type").toString();
            String content = params.get("content").toString();
            String status = params.get("status").toString();

            if (customerIdStr == null || customerIdStr.trim().isEmpty() ||
                orderIdStr == null || orderIdStr.trim().isEmpty() ||
                content == null || content.trim().isEmpty()) {
                ResponseUtils.error(resp, "Customer ID, Order ID, and Content are required");
                return;
            }

            int customerId = Integer.parseInt(customerIdStr);
            int orderId = Integer.parseInt(orderIdStr);

            FeedbackDTO feedback = CFBService.handlingCreateFeedBack(customerId, orderId, type, content, status);

            if (feedback != null) {
                ResponseUtils.success(resp, "Feedback created successfully", feedback);
            } else {
                ResponseUtils.error(resp, "Failed to create feedback");
            }

        } catch (NumberFormatException e) {
            ResponseUtils.error(resp, "Invalid format for Customer ID or Order ID");
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error creating feedback: " + e.getMessage());
        }
    }
}