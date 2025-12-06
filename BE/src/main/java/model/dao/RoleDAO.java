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
import model.dto.RoleDTO;
import utils.DbUtils;

/**
 *
 * @author Admin
 */
public class RoleDAO {
    private static final String TABLE_NAME = "Role";

    private RoleDTO mapToRole(ResultSet rs) throws SQLException {
        return new RoleDTO(
            rs.getInt("role_id"),
            rs.getString("role_name")
        );
    }

    public List<RoleDTO> retrieve(String condition, Object... params) {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + condition;
        try (Connection conn = DbUtils.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) ps.setObject(i + 1, params[i]);
            ResultSet rs = ps.executeQuery();
            List<RoleDTO> list = new ArrayList<>();
            while (rs.next()) list.add(mapToRole(rs));
            return list;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
