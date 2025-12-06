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
import java.util.List;
import java.util.Map;
import model.dto.VehicleModelDTO;
import model.service.ViewInventoryService;
import utils.RequestUtils;
import utils.ResponseUtils;

/**
 *
 * @author khoac
 */
@WebServlet("/api/staff/searchModelInventory")
public class SearchInventoryController extends HttpServlet {

    private final ViewInventoryService service = new ViewInventoryService();

    @Override

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(request);

            Object modelNameObj = params.get("model_name");
            String modelName = (modelNameObj == null) ? null : modelNameObj.toString().trim();

            if (modelName == null || modelName.isEmpty()) {
                ResponseUtils.error(response, "model name is required");
                return;
            }

            List<VehicleModelDTO> models = service.getInventoryByModelName(modelName);

            if (models != null && !models.isEmpty()) {
                ResponseUtils.success(response, "Inventory model found.", models);
            } else {
                ResponseUtils.error(response, "No inventory model found with name: " + models);
            }

        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(response, "Error retrieving model: " + e.getMessage());
        }
    }

}
