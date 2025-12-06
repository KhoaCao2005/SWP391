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
import model.service.CustomerService;
import utils.RequestUtils;
import utils.ResponseUtils;


/**
 *
 * @author Admin
 */
@WebServlet("/api/staff/createCustomer")
public class CreateCustomerController extends HttpServlet {

    private final CustomerService service = new CustomerService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
             Map<String, Object> params = RequestUtils.extractParams(req);
            String name = params.get("name").toString();
            String address = params.get("address").toString();
            String email = params.get("email").toString();
            String phoneNumber = params.get("phoneNumber").toString();

            if (name == null || name.trim().isEmpty() || email == null || email.trim().isEmpty()) {
                ResponseUtils.error(resp, "Name and Email are required");
                return;
            }

            int customerId = service.HandlingCreateCustomer(name, address, email, phoneNumber);
            if (customerId > 0) {
                ResponseUtils.success(resp, "Customer created successfully", "Customer ID: " + customerId);
            } else {
                ResponseUtils.error(resp, "Failed to create customer");
            }

        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error creating customer: " + e.getMessage());
        }
    }
}
