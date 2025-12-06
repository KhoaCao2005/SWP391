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
import model.dto.DealerDTO;
import utils.DbUtils;

/**
 *
 * @author Admin
 */
public class DealerDAO {

    private static final String TABLE_NAME = "Dealer";

    private DealerDTO mapToDealer(ResultSet rs) throws SQLException {
        return new DealerDTO(
                rs.getInt("dealer_id"),
                rs.getString("dealer_name"),
                rs.getString("address"),
                rs.getString("phone_number")
        );
    }

    public List<DealerDTO> retrieve(String condition, Object... params) {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + condition;
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            ResultSet rs = ps.executeQuery();
            List<DealerDTO> list = new ArrayList<>();
            while (rs.next()) {
                list.add(mapToDealer(rs));
            }
            return list;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public DealerDTO GetDealerById(int id) {
        return retrieve("dealer_id=?", id).get(0);
    }

    public List<DealerDTO> findByName(String name) {
        return retrieve("dealer_name = ?", name);
    }
    
    public List<DealerDTO> getAllDealers() {
        return retrieve("1 = 1");
    }
    
}
