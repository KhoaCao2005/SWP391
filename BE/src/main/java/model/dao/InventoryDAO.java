/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package model.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import model.dto.InventoryDTO;
import utils.DbUtils;

/**
 *
 * @author Admin
 */
public class InventoryDAO {

    private static final String TABLE_NAME = "Inventory";

    private InventoryDTO mapToInventory(ResultSet rs) throws SQLException {
        return new InventoryDTO(
                rs.getInt("inventory_id"),
                rs.getInt("model_id"),
                rs.getString("quantity")
        );
    }

    public List<InventoryDTO> retrieve(String condition, Object... params) {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + condition;
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            ResultSet rs = ps.executeQuery();
            List<InventoryDTO> list = new ArrayList<>();
            while (rs.next()) {
                list.add(mapToInventory(rs));
            }
            return list;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public List<InventoryDTO> viewAllInventory() {
        return retrieve("1 = 1");
    }

    public List<InventoryDTO> getInventoryByModelId(int id) {
        return retrieve("model_id = ?", id);
    }

    public int getAvailableSerialCountByModelId(int modelId) {
        String sql = "SELECT COUNT(DISTINCT vs.serial_id) as available_count "
                + "FROM VehicleSerial vs "
                + "INNER JOIN VehicleVariant vv ON vs.variant_id = vv.variant_id "
                + "WHERE vv.model_id = ? "
                // Exclude serials ordered by actual customers
                + "AND vs.serial_id NOT IN ("
                + "    SELECT od.serial_id "
                + "    FROM OrderDetail od "
                + "    INNER JOIN [Order] o ON od.order_id = o.order_id "
                + "    WHERE od.serial_id IS NOT NULL "
                + "    AND o.customer_id > 0"
                + ") "
                // AND (unordered OR ordered by dealers - not actual customers)
                + "AND ("
                + "    vs.serial_id NOT IN ("
                + "        SELECT od2.serial_id "
                + "        FROM OrderDetail od2 "
                + "        WHERE od2.serial_id IS NOT NULL"
                + "    ) "
                + "    OR vs.serial_id IN ("
                + "        SELECT od3.serial_id "
                + "        FROM OrderDetail od3 "
                + "        INNER JOIN [Order] o3 ON od3.order_id = o3.order_id "
                + "        WHERE od3.serial_id IS NOT NULL "
                + "        AND o3.customer_id = 0"
                + "    )"
                + ")";

        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, modelId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return rs.getInt("available_count");
            }
        } catch (Exception e) {
            System.err.println("Error in getAvailableSerialCountByModelId(): " + e.getMessage());
            e.printStackTrace();
        }
        return 0;
    }

}
