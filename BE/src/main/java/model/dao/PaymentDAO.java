package model.dao;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import model.dto.PaymentDTO;
import utils.DbUtils;

public class PaymentDAO {

    private static final String TABLE_NAME = "Payment";

    private PaymentDTO mapToPayment(ResultSet rs) throws SQLException {
        return new PaymentDTO(
                rs.getInt("order_id"),
                rs.getString("method"),
                rs.getDouble("amount"),
                rs.getString("payment_date")
        );
    }

    public List<PaymentDTO> retrieve(String condition, Object... params) {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + condition;
        try (Connection conn = DbUtils.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            ResultSet rs = ps.executeQuery();
            List<PaymentDTO> list = new ArrayList<>();
            while (rs.next()) {
                list.add(mapToPayment(rs));
            }
            return list;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean create(PaymentDTO payment) throws ClassNotFoundException {
        if (payment.getMethod() == null || payment.getMethod().isEmpty()) {
            payment.setMethod("TT");
        }

        String sql = "INSERT INTO " + TABLE_NAME + " (order_id, amount, payment_date, method) VALUES (?, ?, ?, ?)";
        try (Connection conn = DbUtils.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setInt(1, payment.getOrderId());
            ps.setDouble(2, payment.getAmount());
            ps.setString(3, payment.getPaymentDate());
            ps.setString(4, payment.getMethod());

            int rows = ps.executeUpdate();

            if (rows > 0) {
                ResultSet rs = ps.getGeneratedKeys();
                if (rs.next()) {
                    payment.setPaymentId(rs.getInt(1));
                }
                return true;
            }
        } catch (SQLException e) {
            System.out.println("Error creating payment: " + e.getMessage());
        }
        return false;
    }

    public List<PaymentDTO> getAllPayment() {
        return retrieve("1 = 1");
    }

    public PaymentDTO findPaymentById(int paymentId) {
        List<PaymentDTO> list = retrieve("payment_id = ?", paymentId);
        if (list != null && !list.isEmpty()) {
            return list.get(0);
        }
        
        return null;
    }
    
    public PaymentDTO findPaymentByOrderId(int orderId) {
        List<PaymentDTO> list = retrieve("order_id = ?", orderId);
        if (list != null && !list.isEmpty()) {
            return list.get(0);
        }
        
        return null;
    }

    public List<PaymentDTO> findPaymentListByOrderId(int orderId) {
        return retrieve("order_id = ?", orderId);
    }
}
