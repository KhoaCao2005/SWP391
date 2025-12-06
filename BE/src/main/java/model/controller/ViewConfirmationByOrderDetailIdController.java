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
import model.dto.ConfirmationDTO;
import model.service.OrderService;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/viewConfirmationByOrderDetailId")
public class ViewConfirmationByOrderDetailIdController extends HttpServlet {

    private final OrderService service = new OrderService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(req);
            Object idObj = params.get("order_detail_id");

            if (idObj == null) {
                ResponseUtils.error(resp, "Missing parameter: order_detail_id");
                return;
            }

            int orderDetailId = Integer.parseInt(idObj.toString());

            // Call service
            List<ConfirmationDTO> confirmations = service.getConfirmationByOrderDetailId(orderDetailId);

            if (confirmations != null && !confirmations.isEmpty()) {
                ResponseUtils.success(resp, "Confirmations retrieved successfully", confirmations);
            } else {
                ResponseUtils.success(resp, "No confirmations found for this Order Detail ID", confirmations);
            }

        } catch (NumberFormatException e) {
            ResponseUtils.error(resp, "Invalid order_detail_id format");
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error retrieving confirmations: " + e.getMessage());
        }
    }
}
