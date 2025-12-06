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
import java.util.UUID;
import model.dto.VehicleSerialDTO;
import utils.DbUtils;

/**
 *
 * @author Admin
 */
public class VehicleSerialDAO {

    private static final String TABLE_NAME = "VehicleSerial";
    private static final String INSERT_SQL = "INSERT INTO " + TABLE_NAME + " (serial_id, variant_id) VALUES (?, ?)";

    private VehicleSerialDTO mapToVehicleSerial(ResultSet rs) throws SQLException {
        return new model.dto.VehicleSerialDTO(
                rs.getString("serial_id"),
                rs.getInt("variant_id")
        );
    }

    public List<VehicleSerialDTO> retrieve(String condition, Object... params) {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + condition;
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            ResultSet rs = ps.executeQuery();
            List<VehicleSerialDTO> list = new ArrayList<>();
            while (rs.next()) {
                list.add(mapToVehicleSerial(rs));
            }
            return list;
        } catch (Exception e) {
            System.err.println("Error in retrieve(): " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    public String generateSerialId() {
        String uuid = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase();
        return uuid;
    }

    public int create(Connection conn, VehicleSerialDTO serial) throws SQLException {
        try ( PreparedStatement ps = conn.prepareStatement(INSERT_SQL)) {
            ps.setString(1, serial.getSerialId());
            ps.setInt(2, serial.getVariantId());
            return ps.executeUpdate();
        }
    }

    public VehicleSerialDTO getSerialBySerialId(String serialId) {
        List<VehicleSerialDTO> lists = retrieve("serial_id = ?", serialId);
        return lists.get(0);
    }

    public int batchCreate(Connection conn, List<VehicleSerialDTO> serials) throws SQLException {
        if (serials == null || serials.isEmpty()) {
            return 0;
        }
        String sql = "INSERT INTO VehicleSerial (serial_id, variant_id) VALUES (?, ?)";
        try ( PreparedStatement ps = conn.prepareStatement(sql)) {
            for (VehicleSerialDTO s : serials) {
                ps.setString(1, s.getSerialId());
                ps.setInt(2, s.getVariantId());
                ps.addBatch();
            }
            int[] results = ps.executeBatch();
            return results.length;
        }
    }

    public List<VehicleSerialDTO> getAvailableSerialsByVariantId(Connection conn, int variantId) {
        String sql = "SELECT vs.serial_id, vs.variant_id "
                + "FROM VehicleSerial vs "
                + "WHERE vs.variant_id = ? "
                + "AND vs.serial_id NOT IN ("
                + "    SELECT od.serial_id "
                + "    FROM OrderDetail od "
                + "    INNER JOIN [Order] o ON od.order_id = o.order_id "
                + "    WHERE od.serial_id IS NOT NULL "
                + "    AND o.customer_id > 0"
                + ") "
                + "AND vs.serial_id NOT IN ("
                + "    SELECT od2.serial_id "
                + "    FROM OrderDetail od2 "
                + "    INNER JOIN Confirmation c ON c.order_detail_id = od2.order_detail_id "
                + "    WHERE od2.serial_id IS NOT NULL "
                + "    AND c.agreement != 'Agree'" // Only include approved confirmations
                + ")";

        List<VehicleSerialDTO> list = new ArrayList<>();
        try ( PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, variantId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                VehicleSerialDTO serial = new VehicleSerialDTO();
                serial.setSerialId(rs.getString("serial_id"));
                serial.setVariantId(rs.getInt("variant_id"));
                list.add(serial);
            }
            return list;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<VehicleSerialDTO> getUnorderedOrDealerOrderedSerialsByVariantIdAndDealer(int variantId, int dealerId) {
        String sql = "SELECT DISTINCT vs.serial_id, vs.variant_id "
                + "FROM VehicleSerial vs "
                + "WHERE vs.variant_id = ? "
                // Exclude serials ordered by actual customers
                + "AND vs.serial_id NOT IN ("
                + "    SELECT od.serial_id "
                + "    FROM OrderDetail od "
                + "    INNER JOIN [Order] o ON od.order_id = o.order_id "
                + "    WHERE od.serial_id IS NOT NULL "
                + "    AND o.customer_id > 0"
                + ") "
                // AND (unordered OR ordered by this specific dealer)
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
                + "        INNER JOIN UserAccount ua ON o3.dealer_staff_id = ua.user_id "
                + "        WHERE od3.serial_id IS NOT NULL "
                + "        AND o3.customer_id = 0 "
                + "        AND ua.dealer_id = ?"
                + "    )"
                + ")";

        List<VehicleSerialDTO> list = new ArrayList<>();
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, variantId);
            ps.setInt(2, dealerId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                VehicleSerialDTO serial = new VehicleSerialDTO();
                serial.setSerialId(rs.getString("serial_id"));
                serial.setVariantId(rs.getInt("variant_id"));
                list.add(serial);
            }
            return list;
        } catch (Exception e) {
            System.err.println("Error in getUnorderedOrDealerOrderedSerialsByVariantIdAndDealer(): " + e.getMessage());
            e.printStackTrace();
        }
        return list;
    }
}
