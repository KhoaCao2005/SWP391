package model.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import model.dto.ConfirmationDTO;
import model.dto.OrderDTO;
import utils.DbUtils;

public class OrderDAO {

    private static final String TABLE_NAME = "[Order]";
    private static final String INSERT_ORDER = "INSERT INTO " + TABLE_NAME
            + " (customer_id, dealer_staff_id, model_id, order_date, status) VALUES (?, ?, ?, ?, ?)";

    private OrderDTO mapToOrder(ResultSet rs) throws SQLException {
        return new OrderDTO(
                rs.getInt("order_id"),
                rs.getInt("customer_id"),
                rs.getInt("dealer_staff_id"),
                rs.getInt("model_id"),
                rs.getString("order_date"),
                rs.getString("status")
        );
    }

    public List<OrderDTO> retrieve(String condition, Object... params) throws SQLException, ClassNotFoundException {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + condition;
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            ResultSet rs = ps.executeQuery();
            List<OrderDTO> list = new ArrayList<>();
            while (rs.next()) {
                list.add(mapToOrder(rs));
            }
            return list;
        }
    }

    public int create(Connection conn, OrderDTO order) throws SQLException {
        try ( PreparedStatement ps = conn.prepareStatement(INSERT_ORDER, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, order.getCustomerId());
            ps.setInt(2, order.getDealerStaffId());
            ps.setInt(3, order.getModelId());
            ps.setString(4, order.getOrderDate());
            ps.setString(5, order.getStatus());

            int affectedRows = ps.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Creating order failed, no rows affected.");
            }

            try ( ResultSet generatedKeys = ps.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    return generatedKeys.getInt(1);
                } else {
                    throw new SQLException("Creating order failed, no ID obtained.");
                }
            }
        }
    }

    public OrderDTO getById(int orderId) throws SQLException, ClassNotFoundException {
        List<OrderDTO> orders = retrieve("order_id = ?", orderId);
        if (orders != null && !orders.isEmpty()) {
            return orders.get(0);
        }
        return null;
    }

    public List<OrderDTO> getByStaffId(int dealerStaffId) throws SQLException, ClassNotFoundException {
        return retrieve("dealer_staff_id=? AND customer_id != 0", dealerStaffId);
    }

    public List<OrderDTO> getByCustomerIdAndDealerId(int customerId, int dealerId) throws SQLException, ClassNotFoundException {
        String sql = "SELECT o.* FROM [Order] o "
                + "INNER JOIN UserAccount u ON o.dealer_staff_id = u.user_id "
                + "WHERE u.dealer_id = ? AND o.customer_id = ?";

        List<OrderDTO> orders = new ArrayList<>();

        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, dealerId);
            ps.setInt(2, customerId);

            try ( ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    orders.add(mapToOrder(rs));
                }
            }
        }

        return orders;
    }

    public List<OrderDTO> getAllByDealerId(int dealerId) throws SQLException, ClassNotFoundException {
        String sql = "SELECT o.* FROM [Order] o "
                + "INNER JOIN UserAccount u ON o.dealer_staff_id = u.user_id "
                + "WHERE u.dealer_id = ? AND o.customer_id != 0";

        List<OrderDTO> orders = new ArrayList<>();

        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, dealerId);

            try ( ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    orders.add(mapToOrder(rs));
                }
            }
        }

        return orders;
    }

    public List<OrderDTO> getAllOrderFromDealer(int dealerId) throws SQLException, ClassNotFoundException {
        String sql = "SELECT o.*, od.order_detail_id, c.confirmation_id, c.staff_admin_id, "
                + "c.agreement, c.date_time "
                + "FROM [Order] o "
                + "INNER JOIN UserAccount u ON o.dealer_staff_id = u.user_id "
                + "LEFT JOIN OrderDetail od ON o.order_id = od.order_id "
                + "LEFT JOIN Confirmation c ON od.order_detail_id = c.order_detail_id "
                + "WHERE u.dealer_id = ? AND o.customer_id = 0"
                + "ORDER BY o.order_date DESC, o.order_id DESC";

        List<OrderDTO> orders = new ArrayList<>();

        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, dealerId);

            try ( ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    OrderDTO order = mapToOrder(rs);

                    // Add confirmation data if exists
                    if (rs.getObject("confirmation_id") != null) {
                        ConfirmationDTO confirmation = new ConfirmationDTO(
                                rs.getInt("confirmation_id"),
                                rs.getInt("staff_admin_id"),
                                rs.getInt("order_detail_id"),
                                rs.getString("agreement"),
                                rs.getString("date_time")
                        );
                        // You'll need to add a method to set confirmation in OrderDTO
                        order.setConfirmation(confirmation);
                    }

                    orders.add(order);
                }
            }
        }

        return orders;
    }

    public List<OrderDTO> getOrdersByDealerStaffIds(List<Integer> staffIds) throws ClassNotFoundException, SQLException {
        List<OrderDTO> orders = new ArrayList<>();
        if (staffIds == null || staffIds.isEmpty()) {
            return orders;
        }

        StringBuilder inClause = new StringBuilder();
        for (int i = 0; i < staffIds.size(); i++) {
            inClause.append("?");
            if (i < staffIds.size() - 1) {
                inClause.append(",");
            }
        }

        String sql = "SELECT * FROM [Order] WHERE dealer_staff_id IN (" + inClause + ")";
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {

            for (int i = 0; i < staffIds.size(); i++) {
                ps.setInt(i + 1, staffIds.get(i));
            }

            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                orders.add(mapToOrder(rs));
            }
        }
        return orders;
    }

    public int countOrdersByDealerStaffId(int dealerStaffId) throws ClassNotFoundException, SQLException {
        List<OrderDTO> list = retrieve("dealer_staff_id = ?", dealerStaffId);
        return list.size();
    }

    public boolean deleteById(Connection conn, int orderId) throws SQLException {
        String sql = "DELETE FROM [Order] WHERE order_id = ?";
        try ( PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, orderId);
            int rows = ps.executeUpdate();
            return rows > 0;
        }
    }

    public boolean updateStatus(int orderId, String newStatus) throws SQLException, ClassNotFoundException {
        String sql = "UPDATE [Order] SET status = ? WHERE order_id = ?";
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newStatus);
            ps.setInt(2, orderId);
            return ps.executeUpdate() > 0;
        }
    }

    public List<Map<String, Object>> retrieveOrdersWithConfirmedDetails()
            throws SQLException, ClassNotFoundException {
        String sql = "SELECT o.order_id, o.customer_id, o.dealer_staff_id, o.model_id, o.order_date, o.status, "
                + "d.order_detail_id, d.serial_id, d.quantity, d.unit_price "
                + "FROM [Order] o "
                + "JOIN OrderDetail d ON o.order_id = d.order_id "
                + "WHERE EXISTS (SELECT 1 FROM Confirmation c WHERE c.order_detail_id = d.order_detail_id) "
                + "ORDER BY o.order_date DESC";

        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {

            ResultSet rs = ps.executeQuery();
            List<Map<String, Object>> list = new ArrayList<>();

            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();

                // Order info
                row.put("order_id", rs.getInt("order_id"));
                row.put("customer_id", rs.getInt("customer_id"));
                row.put("dealer_staff_id", rs.getInt("dealer_staff_id"));
                row.put("model_id", rs.getInt("model_id"));
                row.put("order_date", rs.getString("order_date"));
                row.put("status", rs.getString("status"));

                // Order detail info
                row.put("order_detail_id", rs.getInt("order_detail_id"));
                row.put("serial_id", rs.getString("serial_id"));
                row.put("quantity", rs.getInt("quantity"));
                row.put("unit_price", rs.getDouble("unit_price"));

                list.add(row);
            }

            return list;
        }
    }

    public List<OrderDTO> getAllApprovedOrdersFromAllDealers() throws SQLException, ClassNotFoundException {
        String sql = "SELECT o.*, od.order_detail_id, c.confirmation_id, c.staff_admin_id, "
                + "c.agreement, c.date_time, u.dealer_id, u.user_id as dealer_staff_id "
                + "FROM [Order] o "
                + "INNER JOIN UserAccount u ON o.dealer_staff_id = u.user_id "
                + "INNER JOIN OrderDetail od ON o.order_id = od.order_id "
                + "INNER JOIN Confirmation c ON od.order_detail_id = c.order_detail_id "
                + "WHERE o.customer_id = 0 AND c.agreement = 'Agree' "
                + "ORDER BY o.order_date DESC, o.order_id DESC";

        List<OrderDTO> orders = new ArrayList<>();

        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {

            try ( ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    OrderDTO order = mapToOrder(rs);

                    // Add confirmation data
                    ConfirmationDTO confirmation = new ConfirmationDTO(
                            rs.getInt("confirmation_id"),
                            rs.getInt("staff_admin_id"),
                            rs.getInt("order_detail_id"),
                            rs.getString("agreement"),
                            rs.getString("date_time")
                    );
                    order.setConfirmation(confirmation);

                    orders.add(order);
                }
            }
        }

        return orders;
    }

    public Map<String, Object> calculateCompanyYearlySalesTarget(Integer year)
            throws SQLException, ClassNotFoundException {

        if (year == null) {
            year = java.time.Year.now().getValue(); // Current year
        }

        String sql = "SELECT "
                + "COUNT(DISTINCT o.order_id) as total_orders, "
                + "COUNT(DISTINCT od.order_detail_id) as total_cars, "
                + "SUM(od.quantity) as total_quantity, "
                + "SUM(od.unit_price * od.quantity) as total_revenue "
                + "FROM [Order] o "
                + "INNER JOIN OrderDetail od ON o.order_id = od.order_id "
                + "INNER JOIN Confirmation c ON od.order_detail_id = c.order_detail_id "
                + "WHERE c.agreement = 'Agree' "
                + "AND o.customer_id = 0 "
                + "AND YEAR(c.date_time) = ?";

        Map<String, Object> result = new HashMap<>();

        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, year);

            try ( ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    result.put("year", year);
                    result.put("totalOrders", rs.getInt("total_orders"));
                    result.put("totalCars", rs.getInt("total_cars"));
                    result.put("totalQuantity", rs.getInt("total_quantity"));
                    result.put("totalRevenue", rs.getDouble("total_revenue"));
                } else {
                    result.put("year", year);
                    result.put("totalOrders", 0);
                    result.put("totalCars", 0);
                    result.put("totalQuantity", 0);
                    result.put("totalRevenue", 0.0);
                }
            }
        }

        return result;
    }

    public List<Map<String, Object>> calculateCompanyMonthlyBreakdown(Integer year)
            throws SQLException, ClassNotFoundException {

        if (year == null) {
            year = java.time.Year.now().getValue();
        }

        String sql = "SELECT "
                + "MONTH(c.date_time) as month, "
                + "COUNT(DISTINCT o.order_id) as total_orders, "
                + "COUNT(DISTINCT od.order_detail_id) as total_cars, "
                + "SUM(od.quantity) as total_quantity, "
                + "SUM(od.unit_price * od.quantity) as total_revenue "
                + "FROM [Order] o "
                + "INNER JOIN OrderDetail od ON o.order_id = od.order_id "
                + "INNER JOIN Confirmation c ON od.order_detail_id = c.order_detail_id "
                + "WHERE c.agreement = 'Agree' "
                + "AND o.customer_id = 0 "
                + "AND YEAR(c.date_time) = ? "
                + "GROUP BY MONTH(c.date_time) "
                + "ORDER BY MONTH(c.date_time)";

        List<Map<String, Object>> monthlyData = new ArrayList<>();

        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, year);

            try ( ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> monthData = new HashMap<>();
                    monthData.put("month", rs.getInt("month"));
                    monthData.put("totalOrders", rs.getInt("total_orders"));
                    monthData.put("totalCars", rs.getInt("total_cars"));
                    monthData.put("totalQuantity", rs.getInt("total_quantity"));
                    monthData.put("totalRevenue", rs.getDouble("total_revenue"));
                    monthlyData.add(monthData);
                }
            }
        }

        return monthlyData;
    }

}
