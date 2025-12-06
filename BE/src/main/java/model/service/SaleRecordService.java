package model.service;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.*;

import model.dao.DealerDAO;
import model.dao.OrderDAO;
import model.dao.OrderDetailDAO;
import model.dao.SaleRecordDAO;
import model.dao.UserAccountDAO;
import model.dto.DealerDTO;
import model.dto.OrderDTO;
import model.dto.OrderDetailDTO;
import model.dto.SaleRecordDTO;
import model.dto.UserAccountDTO;

public class SaleRecordService {

    private final DealerDAO dealerDAO = new DealerDAO();
    private final OrderDAO orderDAO = new OrderDAO();
    private final OrderDetailDAO orderDetailDAO = new OrderDetailDAO();
    private final UserAccountDAO userDAO = new UserAccountDAO();
    private final SaleRecordDAO saleDAO = new SaleRecordDAO();

    // ------------------ Dealer Sales Summary ------------------
    public List<Map<String, Object>> getDealerSalesSummary(String startDate, String endDate) throws ClassNotFoundException, SQLException {
        List<DealerDTO> dealerList = dealerDAO.retrieve("1=1"); // Get all dealers
        List<Map<String, Object>> responseList = new ArrayList<>();
        Set<Integer> addedDealerIds = new HashSet<>();

        for (DealerDTO dealer : dealerList) {
            if (addedDealerIds.contains(dealer.getDealerId())) {
                continue;
            }

            BigDecimal totalSales = BigDecimal.ZERO;
            int totalOrders = 0;

            // Get all staff for this dealer
            List<Integer> staffIds = userDAO.getStaffIdsByDealer(dealer.getDealerId());
            if (staffIds != null && !staffIds.isEmpty()) {

                // Process orders for each staff member
                for (Integer staffId : staffIds) {
                    try {
                        List<OrderDTO> allOrders = orderDAO.getByStaffId(staffId);
                        if (allOrders == null || allOrders.isEmpty()) {
                            continue;
                        }

                        for (OrderDTO order : allOrders) {
                            // Filter by date range if provided
                            if (startDate != null && endDate != null) {
                                if (!isOrderInRange(order, startDate, endDate)) {
                                    continue;
                                }
                            }

                            try {
                                OrderDetailDTO detail = orderDetailDAO.getOrderDetailByOrderId(order.getOrderId());
                                if (detail == null) {
                                    continue;
                                }

                                String quantityStr = detail.getQuantity();
                                if (quantityStr == null || quantityStr.trim().isEmpty()) {
                                    continue;
                                }

                                int quantity = Integer.parseInt(quantityStr.trim());
                                BigDecimal saleAmount = BigDecimal.valueOf(detail.getUnitPrice())
                                        .multiply(BigDecimal.valueOf(quantity));

                                totalSales = totalSales.add(saleAmount);
                                totalOrders++;

                            } catch (NumberFormatException e) {
                                System.err.println("Invalid quantity format for order ID " + order.getOrderId());
                            } catch (Exception e) {
                                System.err.println("Error processing order ID " + order.getOrderId() + ": " + e.getMessage());
                            }
                        }

                    } catch (Exception e) {
                        System.err.println("Error processing staff ID " + staffId + ": " + e.getMessage());
                    }
                }
            }

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("dealerId", dealer.getDealerId());
            map.put("dealerName", dealer.getDealerName());
            map.put("address", dealer.getAddress());
            map.put("phoneNumber", dealer.getPhoneNumber());
            map.put("totalSales", totalSales); // BigDecimal preserves full precision
            map.put("totalOrders", totalOrders);

            responseList.add(map);
            addedDealerIds.add(dealer.getDealerId());
        }

        return responseList;
    }

    // ------------------ Orders by Dealer ------------------
    public List<OrderDTO> getOrdersByDealer(int dealerId) {
        try {
            List<Integer> staffIds = userDAO.getStaffIdsByDealer(dealerId);
            if (staffIds == null || staffIds.isEmpty()) {
                return new ArrayList<>();
            }
            return orderDAO.getOrdersByDealerStaffIds(staffIds);
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    // ------------------ Combined Sale Records by Dealer ------------------
    public List<SaleRecordDTO> getCombinedSaleRecordsForDealerByDateRange(
            int dealerId, String startDate, String endDate) {
        try {
            List<Integer> staffIds = userDAO.getStaffIdsByDealer(dealerId);
            if (staffIds == null || staffIds.isEmpty()) {
                return Collections.emptyList();
            }

            List<SaleRecordDTO> allSales = new ArrayList<>();
            for (Integer staffId : staffIds) {
                allSales.addAll(getCombinedSaleRecordsForStaffByDateRange(staffId, startDate, endDate));
            }
            return allSales;

        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    // ------------------ Combined Sale Records by Staff ------------------
    public List<SaleRecordDTO> getCombinedSaleRecordsForStaffByDateRange(
            int dealerStaffId, String startDate, String endDate) {

        System.out.println("DEBUG: Processing sales for Staff ID: " + dealerStaffId);

        try {
            List<OrderDTO> allOrders = orderDAO.getByStaffId(dealerStaffId);
            if (allOrders == null || allOrders.isEmpty()) {
                System.out.println("DEBUG: Staff ID " + dealerStaffId + " has no orders in the database.");
                return Collections.emptyList();
            }

            Map<Integer, BigDecimal> totalSalesByCustomer = new HashMap<>();
            Map<Integer, Integer> totalOrdersByCustomer = new HashMap<>();
            Map<Integer, String> latestOrderDateByCustomer = new HashMap<>();

            for (OrderDTO order : allOrders) {
                if (!isOrderInRange(order, startDate, endDate)) {
                    continue;
                }
                processOrder(order, totalSalesByCustomer, totalOrdersByCustomer, latestOrderDateByCustomer);
            }

            return buildSaleRecordList(totalSalesByCustomer, totalOrdersByCustomer, latestOrderDateByCustomer, dealerStaffId);

        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    // ------------------ Helper: Check Date Range ------------------
    private boolean isOrderInRange(OrderDTO order, String startDate, String endDate) {
        String orderDate = order.getOrderDate();
        return orderDate != null && orderDate.compareTo(startDate) >= 0 && orderDate.compareTo(endDate) <= 0;
    }

    // ------------------ Helper: Process Single Order ------------------
    private void processOrder(OrderDTO order,
            Map<Integer, BigDecimal> totalSalesByCustomer,
            Map<Integer, Integer> totalOrdersByCustomer,
            Map<Integer, String> latestOrderDateByCustomer) {

        try {
            OrderDetailDTO detail = orderDetailDAO.getOrderDetailByOrderId(order.getOrderId());
            if (detail == null) {
                return;
            }

            String quantityStr = detail.getQuantity();
            if (quantityStr == null || quantityStr.trim().isEmpty()) {
                return;
            }

            int quantity = Integer.parseInt(quantityStr.trim());
            BigDecimal saleAmount = BigDecimal.valueOf(detail.getUnitPrice()).multiply(BigDecimal.valueOf(quantity));

            int customerId = order.getCustomerId();
            totalSalesByCustomer.put(customerId,
                    totalSalesByCustomer.getOrDefault(customerId, BigDecimal.ZERO).add(saleAmount));
            totalOrdersByCustomer.put(customerId,
                    totalOrdersByCustomer.getOrDefault(customerId, 0) + 1);

            // Update latest order date
            String currentLatest = latestOrderDateByCustomer.get(customerId);
            if (currentLatest == null || order.getOrderDate().compareTo(currentLatest) > 0) {
                latestOrderDateByCustomer.put(customerId, order.getOrderDate());
            }

        } catch (NumberFormatException e) {
            System.err.println("Invalid quantity format for order ID " + order.getOrderId());
        } catch (Exception e) {
            System.err.println("Error processing order ID " + order.getOrderId() + ": " + e.getMessage());
        }
    }

    // ------------------ Helper: Build SaleRecordDTO List ------------------
    private List<SaleRecordDTO> buildSaleRecordList(Map<Integer, BigDecimal> totalSalesByCustomer,
            Map<Integer, Integer> totalOrdersByCustomer,
            Map<Integer, String> latestOrderDateByCustomer,
            int dealerStaffId) throws ClassNotFoundException {

        List<SaleRecordDTO> combinedSales = new ArrayList<>();
        UserAccountDTO staff = userDAO.getUserById(dealerStaffId);
        String staffName = (staff != null) ? staff.getUsername() : "Unknown";

        for (Integer customerId : totalSalesByCustomer.keySet()) {
            BigDecimal totalAmount = totalSalesByCustomer.get(customerId);
            String latestOrderDate = latestOrderDateByCustomer.get(customerId);

            SaleRecordDTO dto = new SaleRecordDTO(
                    0,
                    dealerStaffId,
                    staffName,
                    latestOrderDate,
                    totalAmount
            );
            combinedSales.add(dto);
        }
        return combinedSales;
    }
}
