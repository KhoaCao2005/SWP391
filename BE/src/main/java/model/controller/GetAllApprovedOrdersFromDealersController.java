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
import model.dto.OrderDTO;
import model.service.OrderService;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/getAllApprovedOrdersFromDealers")
public class GetAllApprovedOrdersFromDealersController extends HttpServlet {

    private final OrderService service = new OrderService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            List<OrderDTO> lists = service.getAllApprovedOrdersFromDealers();

            if (lists == null || lists.isEmpty()) {
                ResponseUtils.error(resp, "No orders found");
            } else {
                ResponseUtils.success(resp, "Retrieved all orders with approved confirmation successfully", lists);
            }

        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Server error while retrieving promotions");
        }
    }
}
