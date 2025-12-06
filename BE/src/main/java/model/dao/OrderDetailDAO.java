package model.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import model.dto.OrderDetailDTO;
import utils.DbUtils;

public class OrderDetailDAO {

    private static final String TABLE_NAME = "OrderDetail";
    private static final String INSERT_ORDER_DETAIL = "INSERT INTO " + TABLE_NAME
            + " (order_id, serial_id, quantity, unit_price) VALUES (?, ?, ?, ?)";

    private OrderDetailDTO mapToOrderDetail(ResultSet rs) throws SQLException {
        return new OrderDetailDTO(
                rs.getInt("order_detail_id"),
                rs.getInt("order_id"),
                rs.getString("serial_id"),
                rs.getString("quantity"),
                rs.getDouble("unit_price")
        );
    }

    public List<OrderDetailDTO> retrieve(String condition, Object... params) throws SQLException, ClassNotFoundException {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + condition;
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            ResultSet rs = ps.executeQuery();
            List<OrderDetailDTO> list = new ArrayList<>();
            while (rs.next()) {
                list.add(mapToOrderDetail(rs));
            }
            return list;
        }
    }

    public int create(Connection conn, OrderDetailDTO detail) throws SQLException {
        try ( PreparedStatement ps = conn.prepareStatement(INSERT_ORDER_DETAIL, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, detail.getOrderId());
            ps.setString(2, detail.getSerialId());
            ps.setInt(3, Integer.parseInt(detail.getQuantity()));
            ps.setDouble(4, detail.getUnitPrice());

            int affectedRows = ps.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Creating order detail failed, no rows affected.");
            }

            // Get the auto-generated order_detail_id
            try ( ResultSet generatedKeys = ps.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    int orderDetailId = generatedKeys.getInt(1);
                    System.out.println("DEBUG: Generated order_detail_id = " + orderDetailId);
                    return orderDetailId; // Return the actual ID, not affectedRows
                } else {
                    throw new SQLException("Creating order detail failed, no ID obtained.");
                }
            }
        }
    }

    public int updateSerialId(Connection conn, int orderDetailId, String serialId) throws SQLException {
        String sql = "UPDATE OrderDetail SET serial_id = ? WHERE order_detail_id = ?";
        try ( PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, serialId);
            ps.setInt(2, orderDetailId);
            return ps.executeUpdate();
        }
    }

    public OrderDetailDTO getOrderDetailByOrderId(int orderId) throws SQLException, ClassNotFoundException {
        List<OrderDetailDTO> details = retrieve("order_id = ?", orderId);
        if (details != null && !details.isEmpty()) {
            return details.get(0);
        }
        return null;
    }

    public List<OrderDetailDTO> getOrderDetailListByOrderId(int orderId) throws SQLException, ClassNotFoundException {
        return retrieve("order_id=?", orderId);
    }

    public double getOrderTotal(int orderId) throws ClassNotFoundException, SQLException {
        String sql = "SELECT SUM(quantity * unit_price) AS total FROM OrderDetail WHERE order_id = ?";
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, orderId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return rs.getDouble("total");
            }
        }
        return 0;
    }

    public boolean updateUnitPrice(int orderDetailId, double unitPrice) throws SQLException, ClassNotFoundException {
        String sql = "UPDATE " + TABLE_NAME + " SET unit_price = ? WHERE order_detail_id = ?";

        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setDouble(1, unitPrice);
            ps.setInt(2, orderDetailId);

            int updated = ps.executeUpdate();
            return updated > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public int[] batchCreateAndReturnIds(Connection conn, List<OrderDetailDTO> details) throws SQLException {
        if (details == null || details.isEmpty()) {
            return new int[0];
        }

        String sql = "INSERT INTO OrderDetail (order_id, serial_id, quantity, unit_price) "
                + "OUTPUT INSERTED.order_detail_id VALUES (?, ?, ?, ?)";
        List<Integer> ids = new ArrayList<>();

        try ( PreparedStatement ps = conn.prepareStatement(sql)) {
            for (OrderDetailDTO d : details) {
                ps.setInt(1, d.getOrderId());
                ps.setString(2, d.getSerialId());
                ps.setString(3, d.getQuantity());
                ps.setDouble(4, d.getUnitPrice());

                try ( ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        ids.add(rs.getInt(1));
                    }
                }
            }
        }
        return ids.stream().mapToInt(Integer::intValue).toArray();
    }

}
