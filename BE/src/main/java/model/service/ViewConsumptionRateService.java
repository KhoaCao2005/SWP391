/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package model.service;

import java.sql.SQLException;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import model.dao.OrderDAO;
import model.dao.OrderDetailDAO;
import model.dao.VehicleModelDAO;
import model.dto.OrderDTO;
import model.dto.OrderDetailDTO;
import model.dto.VehicleModelDTO;

/**
 *
 * @author khoac
 */
public class ViewConsumptionRateService {

    private VehicleModelDAO modelDAO = new VehicleModelDAO();
    private OrderDAO orderDAO = new OrderDAO();
    private OrderDetailDAO orderDetailDAO = new OrderDetailDAO();

    public double handleCalculateConsumptionRate(int modelId) throws SQLException, ClassNotFoundException {
        double totalQuantity = 0;

        List<OrderDTO> orders = orderDAO.retrieve("model_id = ?", modelId);
        if (orders == null || orders.isEmpty()) {
            return 0;
        }

        for (OrderDTO order : orders) {
            List<OrderDetailDTO> details = orderDetailDAO.getOrderDetailListByOrderId(order.getOrderId());
            for (OrderDetailDTO detail : details) {
                try {
                    totalQuantity += Integer.parseInt(detail.getQuantity());
                } catch (NumberFormatException e) {
                }
            }
        }

        int daysInMonth = YearMonth.now().lengthOfMonth();

        return totalQuantity / daysInMonth;
    }

    public List<String> viewModelConsumptionRate() throws SQLException, ClassNotFoundException {
        List<String> result = new ArrayList<>();

        List<VehicleModelDTO> models = modelDAO.viewVehicleModelIsActive();
        for (VehicleModelDTO model : models) {
            double rate = handleCalculateConsumptionRate(model.getModelId());
            result.add(model.getModelName() + " Consumption Rate: " + String.format("%.2f", rate));
        }

        return result;
    }
}
