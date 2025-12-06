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
import model.dto.ConfirmationDTO;
import model.service.OrderService;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/viewAllConfirmations")
public class ViewAllConfirmationController extends HttpServlet {

    private final OrderService service = new OrderService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            List<ConfirmationDTO> confirmations = service.getAllConfirmation();

            if (confirmations != null && !confirmations.isEmpty()) {
                ResponseUtils.success(resp, "All confirmations retrieved successfully", confirmations);
            } else {
                ResponseUtils.success(resp, "No confirmations found", confirmations);
            }
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error retrieving confirmations: " + e.getMessage());
        }
    }
}
