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
import model.service.ViewConsumptionRateService;
import utils.ResponseUtils;

/**
 *
 * @author khoac
 */
@WebServlet("/api/EVM/viewConsumptionRate")
public class ViewConsumptionRateController extends HttpServlet {
    private final ViewConsumptionRateService service = new ViewConsumptionRateService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            ResponseUtils.success(response, "success", service.viewModelConsumptionRate());
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(response, "An error occurred while calculating consumption rate: " + e.getMessage());
        }
    }

}
