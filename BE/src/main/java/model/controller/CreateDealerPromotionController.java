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
import java.util.HashMap;
import java.util.Map;
import model.service.PromotionForDealerService;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author Admin
 */
@WebServlet("/api/EVM/createDealerPromotions")
public class CreateDealerPromotionController extends HttpServlet {

    private final PromotionForDealerService service = new PromotionForDealerService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(request);
            int dealerId = Integer.parseInt(params.get("dealerId").toString());
            int promoId = Integer.parseInt(params.get("promoId").toString());

            boolean success = service.createPromotionForDealer(promoId, dealerId);
            if (success) {
                Map<String, Object> data = new HashMap<>();
                data.put("dealerId", dealerId);
                data.put("promoId", promoId);
                ResponseUtils.success(response, "Promotion assigned to dealer successfully", data);
            } else {
                ResponseUtils.error(response, "Failed to assign promotion to dealer");
            }

        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(response, "Internal server error: " + e.getMessage());
        }
    }
}
