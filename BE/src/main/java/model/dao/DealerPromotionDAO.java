package model.dao;

import java.sql.*;
import java.util.*;
import model.dto.PromotionDTO;
import utils.DbUtils;

public class DealerPromotionDAO {

    private static final String TABLE_NAME = "DealerPromotion";

    public List<PromotionDTO> getPromotionsByDealerId(int dealerId) throws ClassNotFoundException {
        List<PromotionDTO> promotions = new ArrayList<>();
        String sql
                = "SELECT p.promo_id, p.description, p.start_date, p.end_date, p.discount_rate, p.type FROM Promotion p JOIN DealerPromotion dp ON dp.promo_id = p.promo_id WHERE dp.dealer_id = ?";

        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, dealerId);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                promotions.add(new PromotionDTO(
                        rs.getInt("promo_id"),
                        rs.getString("description"),
                        rs.getString("start_date"),
                        rs.getString("end_date"),
                        rs.getString("discount_rate"),
                        rs.getString("type")
                ));
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return promotions;
    }

    public boolean createPromotionForDealer(int promoId, int dealerId) {
        String sql = "INSERT INTO " + TABLE_NAME + " (promo_id, dealer_id) VALUES (?, ?)";
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, promoId);
            ps.setInt(2, dealerId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // Update a promotion for a dealer
    public boolean updatePromotionForDealer(int promoId, int dealerId, int newPromoId) {
        String sql = "UPDATE " + TABLE_NAME + " SET promo_id = ? WHERE promo_id = ? AND dealer_id = ?";
        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, newPromoId);
            ps.setInt(2, promoId);
            ps.setInt(3, dealerId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<Map<String, Object>> getAllPromotionsWithDealers() {
        List<Map<String, Object>> result = new ArrayList<>();

        String sql = "SELECT p.promo_id, p.description, p.start_date, p.end_date, p.discount_rate, p.type, "
                + "d.dealer_id, d.dealer_name "
                + "FROM Promotion p "
                + "LEFT JOIN DealerPromotion dp ON p.promo_id = dp.promo_id "
                + "LEFT JOIN Dealer d ON dp.dealer_id = d.dealer_id "
                + "ORDER BY p.promo_id";

        try ( Connection conn = DbUtils.getConnection();  PreparedStatement ps = conn.prepareStatement(sql);  ResultSet rs = ps.executeQuery()) {

            Map<Integer, Map<String, Object>> promoMap = new LinkedHashMap<>();

            while (rs.next()) {
                int promoId = rs.getInt("promo_id");
                Map<String, Object> promo;

                if (!promoMap.containsKey(promoId)) {
                    promo = new LinkedHashMap<>(); // preserve order
                    promo.put("promoId", promoId);
                    promo.put("description", rs.getString("description"));
                    promo.put("startDate", rs.getString("start_date"));
                    promo.put("endDate", rs.getString("end_date"));
                    promo.put("discountRate", rs.getString("discount_rate"));
                    promo.put("type", rs.getString("type"));
                    promo.put("dealers", new ArrayList<Map<String, Object>>());
                    promoMap.put(promoId, promo);
                } else {
                    promo = promoMap.get(promoId);
                }

                int dealerId = rs.getInt("dealer_id");
                String dealerName = rs.getString("dealer_name");

                if (dealerId > 0) { // only add if dealer exists
                    Map<String, Object> dealer = new LinkedHashMap<>(); // preserve order
                    dealer.put("dealerId", dealerId);
                    dealer.put("dealerName", dealerName);
                    ((List<Map<String, Object>>) promo.get("dealers")).add(dealer);
                }
            }

            result.addAll(promoMap.values());

        } catch (Exception e) {
            e.printStackTrace();
        }

        return result;
    }
}
