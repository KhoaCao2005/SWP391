/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package model.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import model.dto.VehicleModelDTO;
import utils.DbUtils;

/**
 *
 * @author Admin
 */
public class VehicleModelDAO {
    private static final String TABLE_NAME = "VehicleModel";
    private VehicleModelDTO mapToVehicleModel(ResultSet rs) throws SQLException {
        return new VehicleModelDTO(
            rs.getInt("model_id"),
            rs.getString("model_name"),
            rs.getString("description"),
            rs.getBoolean("is_active")
        );
    }

    public List<VehicleModelDTO> retrieve(String condition, Object... params) {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + condition;
        try (Connection conn = DbUtils.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) ps.setObject(i + 1, params[i]);
            ResultSet rs = ps.executeQuery();
            List<VehicleModelDTO> list = new ArrayList<>();
            while (rs.next()) list.add(mapToVehicleModel(rs));
            return list;
        } catch (Exception e) {
            System.err.println("Error in retrieve(): " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }
    
    public List<VehicleModelDTO> viewAllVehicleModel(){
         return retrieve("1 = 1");
    }
    
    public List<VehicleModelDTO> viewVehicleModelIsActive(){
         return retrieve("is_active = 1");
    }
    public List<VehicleModelDTO> SearchVehicleModel(String model_name){
        return retrieve("model_name=?",model_name);
    }

    public List<VehicleModelDTO> viewVehicleModelById(int modelId) {
        return retrieve("model_id=?", modelId);
    }
    
    public VehicleModelDTO create(String modelName, String description) {
        String sql = "INSERT INTO " + TABLE_NAME + " (model_name, description, is_active) VALUES (?, ?, 1)";
        try (Connection conn = DbUtils.getConnection(); 
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, modelName);
            ps.setString(2, description);
            
            int affectedRows = ps.executeUpdate();
            if (affectedRows > 0) {
                ResultSet generatedKeys = ps.getGeneratedKeys();
                if (generatedKeys.next()) {
                    int generatedId = generatedKeys.getInt(1);
                    return new VehicleModelDTO(generatedId, modelName, description, true);
                }
            }
        } catch (Exception e) {
            System.err.println("Error in create(): " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    public boolean update(int modelId, String modelName, String description) {
        String sql = "UPDATE " + TABLE_NAME + " SET model_name = ?, description = ? WHERE model_id = ?";
        try (Connection conn = DbUtils.getConnection(); 
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, modelName);
            ps.setString(2, description);
            ps.setInt(3, modelId);
            
            int affectedRows = ps.executeUpdate();
            return affectedRows > 0;
        } catch (Exception e) {
            System.err.println("Error in update(): " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    public boolean disable(int modelId) {
        String sql = "UPDATE " + TABLE_NAME + " SET is_active = 0 WHERE model_id = ?";
        try (Connection conn = DbUtils.getConnection(); 
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, modelId);
            
            int affectedRows = ps.executeUpdate();
            return affectedRows > 0;
        } catch (Exception e) {
            System.err.println("Error in disable(): " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    public boolean enable(int modelId) {
        String sql = "UPDATE " + TABLE_NAME + " SET is_active = 1 WHERE model_id = ?";
        try (Connection conn = DbUtils.getConnection(); 
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, modelId);
            
            int affectedRows = ps.executeUpdate();
            return affectedRows > 0;
        } catch (Exception e) {
            System.err.println("Error in enable(): " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }
}
