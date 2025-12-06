/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package model.controller;

import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import model.service.ViewInventoryService;
import utils.ResponseUtils;

/**
 *
 * @author khoac
 */
@WebServlet("/api/EVM/viewInventory")
public class ViewInventoryController extends HttpServlet {

    private final ViewInventoryService service = new ViewInventoryService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            ResponseUtils.success(response, "success", service.handleViewActiveInventory());
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(response, "Fail to retrive inventory: " + e.getMessage());
        }
    }

}
