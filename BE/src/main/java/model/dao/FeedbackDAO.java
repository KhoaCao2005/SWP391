package model.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import model.dto.FeedbackDTO;
import utils.DbUtils;

/**
 *
 * @author Admin
 */
public class FeedbackDAO {
    private static final String TABLE_NAME = "Feedback";
    
    private FeedbackDTO mapToFeedback(ResultSet rs) throws SQLException {
        return new FeedbackDTO(
            rs.getInt("feedback_id"),
            rs.getInt("customer_id"),
            rs.getInt("order_id"),
            rs.getString("type"),
            rs.getString("content"),
            rs.getString("status"),
            rs.getString("created_at")
        );
    }
    
    public List<FeedbackDTO> retrieve(String condition, Object... params) {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + condition;
        try (Connection conn = DbUtils.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) ps.setObject(i + 1, params[i]);
            ResultSet rs = ps.executeQuery();
            List<FeedbackDTO> list = new ArrayList<>();
            while (rs.next()) list.add(mapToFeedback(rs));
            return list;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
    
    public FeedbackDTO create(int customer_id, int order_id, String type, String content, String status, String created_at) {
        
        String insertSql = "INSERT INTO " + TABLE_NAME
                + " (customer_id, order_id, type, content, status, created_at) "
                + " VALUES (?, ?, ?, ?, ?, ?)";
        
        int generatedFeedbackId = -1; 

        try (Connection conn = DbUtils.getConnection(); 
             PreparedStatement ps = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
            
            ps.setInt(1, customer_id);
            ps.setInt(2, order_id);
            ps.setString(3, type);
            ps.setString(4, content);
            ps.setString(5, status);
            ps.setString(6, created_at);
            
            int affectedRows = ps.executeUpdate();
            
            if (affectedRows > 0) {
                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) {
                        generatedFeedbackId = rs.getInt(1); 
                    }
                }
                
                if (generatedFeedbackId != -1) {
                    return new FeedbackDTO(
                        generatedFeedbackId, 
                        customer_id, 
                        order_id, 
                        type, 
                        content, 
                        status, 
                        created_at
                    );
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return null; 
    }

   
    public boolean delete(int feedback_id) {
        String sql = "DELETE FROM " + TABLE_NAME + " WHERE feedback_id = ?";

        try (Connection conn = DbUtils.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            ps.setInt(1, feedback_id);
            
            int affectedRows = ps.executeUpdate();
            
            return affectedRows > 0;
            
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        } catch (Exception e) {
             e.printStackTrace();
             return false;
        }
    }
    

    public List<FeedbackDTO> getFeedbackByCustomerId(int customer_id) {
        return retrieve("customer_id = ?", customer_id);
    }
    
    public List<FeedbackDTO> getFeedbackByCustomerIdAndDealer(int customerId, int dealerId) {
        String query = "SELECT DISTINCT f.feedback_id, f.customer_id, f.order_id, f.type, f.content, f.status, f.created_at " +
                       "FROM Feedback f " +
                       "INNER JOIN orders o ON f.order_id = o.order_id " +
                       "INNER JOIN user_account ua ON o.dealer_staff_id = ua.user_id " +
                       "WHERE f.customer_id = ? AND ua.dealer_id = ?";
        
        return retrieve(query, customerId, dealerId);
    }
}