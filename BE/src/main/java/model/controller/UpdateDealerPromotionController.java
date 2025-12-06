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
@WebServlet("/api/EVM/updateDealerPromotion")
public class UpdateDealerPromotionController extends HttpServlet {

    private final PromotionForDealerService service = new PromotionForDealerService();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(request);
            int dealerId = Integer.parseInt(params.get("dealerId").toString());
            int promoId = Integer.parseInt(params.get("promoId").toString());
            int newPromoId = Integer.parseInt(params.get("newPromoId").toString());

            boolean success = service.updatePromotionForDealer(promoId, dealerId, newPromoId);
            if (success) {
                Map<String, Object> data = new HashMap<>();
                data.put("dealerId", dealerId);
                data.put("oldPromoId", promoId);
                data.put("newPromoId", newPromoId);
                ResponseUtils.success(response, "Promotion updated successfully", data);
            } else {
                ResponseUtils.error(response, "Failed to update promotion for dealer");
            }

        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(response, "Internal server error: " + e.getMessage());
        }
    }
}
