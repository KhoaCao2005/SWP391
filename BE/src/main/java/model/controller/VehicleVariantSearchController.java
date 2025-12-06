package model.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import model.dao.VehicleVariantDAO;
import model.dto.VehicleVariantDTO;
import utils.RequestUtils;
import utils.ResponseUtils;

@WebServlet("/api/staff/searchVehicleVariant")
public class VehicleVariantSearchController extends HttpServlet {
    private final VehicleVariantDAO vdao = new VehicleVariantDAO();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(req);
            
            Object idObj = params.get("id");
            String idParam = (idObj == null) ? null : idObj.toString();


            if (idParam == null || idParam.trim().isEmpty()) {
                ResponseUtils.error(resp, "Model ID is required");
                return;
            }

            int modelId = Integer.parseInt(idParam);

            List<VehicleVariantDTO> variants = vdao.viewVehicleVariantIsActive(modelId);

            Map<String, Object> result = new HashMap<>();
            result.put("variants", variants);

            if (variants != null && !variants.isEmpty()) {
                ResponseUtils.success(resp, "Variant(s) found", result);
            } else {
                ResponseUtils.error(resp, "No variant found with id: " + modelId);
            }
        } catch (NumberFormatException e) {
            ResponseUtils.error(resp, "Invalid model ID format");
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error searching for vehicle variant: " + e.getMessage());
        }
    }
}