package model.service;

import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import model.dao.ConfirmationDAO;
import model.dao.OrderDAO;
import model.dao.OrderDetailDAO;
import model.dao.UserAccountDAO;
import model.dao.VehicleModelDAO;
import model.dao.VehicleSerialDAO;
import model.dao.VehicleVariantDAO;
import model.dto.ConfirmationDTO;
import model.dto.OrderDTO;
import model.dto.OrderDetailDTO;
import model.dto.UserAccountDTO;
import model.dto.VehicleModelDTO;
import model.dto.VehicleSerialDTO;
import model.dto.VehicleVariantDTO;
import utils.DbUtils;

public class OrderService {

    private final ConfirmationDAO confirmationDAO = new ConfirmationDAO();
    private final OrderDAO orderDAO = new OrderDAO();
    private final VehicleVariantDAO variantDAO = new VehicleVariantDAO();
    private final VehicleModelDAO modelDAO = new VehicleModelDAO();
    private final VehicleSerialDAO vehicleSerialDAO = new VehicleSerialDAO();
    private final OrderDetailDAO orderDetailDAO = new OrderDetailDAO();
    private final UserAccountDAO userDAO = new UserAccountDAO();

    public int HandlingCreateOrder(
            int customerId,
            int dealerstaffId,
            int modelId,
            String status,
            Integer variantId,
            int quantity,
            double unitPrice,
            boolean isCustom) {

        Connection conn = null;

        try {
            conn = DbUtils.getConnection();
            conn.setAutoCommit(false);

            // Create order
            String currentDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            OrderDTO order = new OrderDTO(customerId, dealerstaffId, modelId, currentDate, status);
            int orderId = orderDAO.create(conn, order);
            if (orderId <= 0) {
                throw new SQLException("Failed to create order");
            }

            // Determine variant
            int finalVariantId;
            double finalUnitPrice;

            if (variantId == null || variantId <= 0) {
                VehicleVariantDTO newVariant = new VehicleVariantDTO();
                newVariant.setModelId(modelId);
                newVariant.setVersionName("Auto-Generated Version");
                newVariant.setColor("Default Color");
                newVariant.setPrice(0.0);
                newVariant.setIsActive(true);

                finalVariantId = variantDAO.create(conn, newVariant);
                if (finalVariantId <= 0) {
                    throw new SQLException("Failed to create variant");
                }
                finalUnitPrice = 0.0;
            } else {
                VehicleVariantDTO variant = variantDAO.findUnitPriceByVariantId(variantId);
                if (variant == null) {
                    throw new SQLException("Variant not found with ID: " + variantId);
                }
                finalVariantId = variantId;
                finalUnitPrice = variant.getPrice();
            }

            // Fetch available serials (not assigned to any customer) for this variant
            List<VehicleSerialDTO> availableSerials = new ArrayList<>();
            if (!isCustom) {
                // Get serials that are not assigned to customers (customer_id = 0 or not in order_detail)
                availableSerials = vehicleSerialDAO.getAvailableSerialsByVariantId(conn, finalVariantId);

                // **CHECK: If not enough available serials, throw exception**
                if (availableSerials == null || availableSerials.size() < quantity) {
                    int availableCount = (availableSerials != null) ? availableSerials.size() : 0;
                    throw new IllegalStateException(
                            "Not enough vehicles available for variant ID " + finalVariantId
                            + ". Requested: " + quantity + ", Available: " + availableCount
                            + ". This variant is sold out!"
                    );
                }
            }

            // Prepare batch lists
            List<VehicleSerialDTO> batchSerials = new ArrayList<>();
            List<OrderDetailDTO> batchDetails = new ArrayList<>();
            List<ConfirmationDTO> batchConfirmations = new ArrayList<>();

            // Generate required entries
            for (int i = 0; i < quantity; i++) {
                String currentSerialId;

                if (!isCustom && i < availableSerials.size()) {
                    // Reuse available serial (not assigned to any customer)
                    currentSerialId = availableSerials.get(i).getSerialId();
                } else if (isCustom) {
                    // Generate new serial for custom orders
                    currentSerialId = vehicleSerialDAO.generateSerialId();
                    VehicleSerialDTO serial = new VehicleSerialDTO(currentSerialId, finalVariantId);
                    batchSerials.add(serial);
                } else {
                    // This should never happen due to the check above, but just in case
                    throw new IllegalStateException("Insufficient serials available");
                }

                // Add OrderDetail
                OrderDetailDTO detail = new OrderDetailDTO();
                detail.setOrderId(orderId);
                detail.setSerialId(currentSerialId);
                detail.setQuantity("1");
                detail.setUnitPrice(finalUnitPrice);
                batchDetails.add(detail);
            }

            // Batch insert serials (only for custom orders)
            if (!batchSerials.isEmpty()) {
                int insertedSerials = vehicleSerialDAO.batchCreate(conn, batchSerials);
                if (insertedSerials != batchSerials.size()) {
                    throw new SQLException("Failed to batch insert vehicle serials");
                }
            }

            // Batch insert order details
            int[] orderDetailIds = orderDetailDAO.batchCreateAndReturnIds(conn, batchDetails);
            if (orderDetailIds.length != batchDetails.size()) {
                throw new SQLException("Failed to batch insert order details");
            }

            // Insert confirmations for custom orders
            if (isCustom) {
                for (int i = 0; i < orderDetailIds.length; i++) {
                    ConfirmationDTO confirm = new ConfirmationDTO();
                    confirm.setUserId(1);
                    confirm.setOrderDetailId(orderDetailIds[i]);
                    confirm.setAgreement("Pending");
                    confirm.setDate(order.getOrderDate());
                    batchConfirmations.add(confirm);
                }

                if (!batchConfirmations.isEmpty()) {
                    int insertedConfirms = confirmationDAO.batchInsert(conn, batchConfirmations);
                    if (insertedConfirms != batchConfirmations.size()) {
                        throw new SQLException("Failed to batch insert confirmations");
                    }
                }
            }

            // Commit transaction
            conn.commit();
            return orderId;

        } catch (IllegalStateException e) {
            // Sold out exception - rollback and rethrow with clear message
            System.err.println("SOLD OUT: " + e.getMessage());
            if (conn != null) try {
                conn.rollback();
            } catch (SQLException ex) {
                ex.printStackTrace();
            }
            throw e; // Rethrow to be handled by controller
        } catch (Exception e) {
            e.printStackTrace();
            if (conn != null) try {
                conn.rollback();
            } catch (SQLException ex) {
                ex.printStackTrace();
            }
            return -1;
        } finally {
            if (conn != null) try {
                conn.setAutoCommit(true);
                conn.close();
            } catch (SQLException ex) {
                ex.printStackTrace();
            }
        }
    }

    public boolean approveCustomOrderByOrderId(int orderId, String decision, String versionName,
            String color, double unitPrice, int staffAdminId) {
        Connection conn = null;
        try {
            conn = DbUtils.getConnection();
            conn.setAutoCommit(false);

            // FIX: Get ALL order details for this order, not just one
            List<OrderDetailDTO> orderDetails = orderDetailDAO.getOrderDetailListByOrderId(orderId);
            if (orderDetails == null || orderDetails.isEmpty()) {
                throw new SQLException("No OrderDetails found for order_id = " + orderId);
            }

            System.out.println("INFO: Processing " + orderDetails.size() + " order details for order_id = " + orderId);

            // Process each order detail
            for (OrderDetailDTO detail : orderDetails) {
                int orderDetailId = detail.getOrderDetailId();
                String serialId = detail.getSerialId();

                if (serialId == null) {
                    System.err.println("WARNING: OrderDetail " + orderDetailId + " has no serial_id, skipping...");
                    continue;
                }

                // Update unit price for this order detail
                boolean updatedPrice = orderDetailDAO.updateUnitPrice(orderDetailId, unitPrice);
                if (!updatedPrice) {
                    throw new SQLException("Failed to update unit_price for order_detail_id = " + orderDetailId);
                }

                // Get variantId via VehicleSerial
                VehicleSerialDTO serial = vehicleSerialDAO.getSerialBySerialId(serialId);
                if (serial == null) {
                    throw new SQLException("No variant found for serial_id = " + serialId);
                }
                int variantId = serial.getVariantId();

                // Get confirmation for this order detail
                ConfirmationDTO confirmation = confirmationDAO.getConfirmationByOrderDetailId(orderDetailId);
                if (confirmation == null) {
                    System.err.println("WARNING: No confirmation found for order_detail_id = " + orderDetailId);
                    continue;
                }

                // Update confirmation with decision & staff_admin_id
                ConfirmationDTO updatedConfirmation = confirmationDAO.updateStatus(
                        confirmation.getConfirmationId(),
                        decision,
                        staffAdminId
                );

                if (updatedConfirmation == null) {
                    throw new SQLException("Failed to update confirmation for confirmation_id = " + confirmation.getConfirmationId());
                }

                // Take action based on decision (only for "Agree")
                if (decision.equalsIgnoreCase("Agree")) {
                    // Update VehicleVariant for this order detail
                    boolean updated = variantDAO.updateVariantById(variantId, versionName, color);
                    if (!updated) {
                        throw new SQLException("Failed to update VehicleVariant for variant_id = " + variantId);
                    }
                    System.out.println("INFO: Updated variant_id = " + variantId + " for order_detail_id = " + orderDetailId);
                }
            }

            // Handle "Disagree" - delete the entire order after processing all details
            if (decision.equalsIgnoreCase("Disagree")) {
                boolean orderDeleted = orderDAO.deleteById(conn, orderId);
                if (!orderDeleted) {
                    throw new SQLException("Failed to delete order_id = " + orderId);
                }
                System.out.println("INFO: Custom order rejected. Deleted order_id = " + orderId + " with all its details");
            } else if (decision.equalsIgnoreCase("Agree")) {
                System.out.println("INFO: Custom order approved for order_id = " + orderId + " with " + orderDetails.size() + " items");
            } else {
                System.out.println("INFO: Custom order decision is pending for order_id = " + orderId + ". No action taken.");
            }

            conn.commit();
            return true;

        } catch (Exception e) {
            e.printStackTrace();
            if (conn != null) try {
                conn.rollback();
            } catch (SQLException ex) {
                ex.printStackTrace();
            }
            return false;
        } finally {
            if (conn != null) try {
                conn.setAutoCommit(true);
                conn.close();
            } catch (SQLException ex) {
                ex.printStackTrace();
            }
        }
    }

    public List<Map<String, Object>> GetListOrderByDealerStaffId(int userId, int roleId, int dealerId) {
        List<Map<String, Object>> enrichedOrderList = new ArrayList<>();
        try {
            List<OrderDTO> orderList;
            if (roleId == 2) {
                orderList = orderDAO.getAllByDealerId(dealerId);
            } else {
                // If staff, get only their orders
                orderList = orderDAO.getByStaffId(userId);
            }

            if (orderList == null || orderList.isEmpty()) {
                return Collections.emptyList();
            }

            for (OrderDTO order : orderList) {
                // Get order detail
                OrderDetailDTO detail = orderDetailDAO.getOrderDetailByOrderId(order.getOrderId());
                order.setDetail(detail);

                // Get dealer staff name
                UserAccountDTO dealerStaff = userDAO.getUserById(order.getDealerStaffId());
                String staffName = (dealerStaff != null) ? dealerStaff.getUsername() : "Unknown";

                // Get model name
                String modelName = "Unknown";
                List<VehicleModelDTO> modelList = modelDAO.viewVehicleModelById(order.getModelId());
                if (modelList != null && !modelList.isEmpty()) {
                    modelName = modelList.get(0).getModelName();
                }

                // Get variant name and serial_id from order detail
                String variantName = null;
                String serialId = null;

                if (detail != null) {
                    serialId = detail.getSerialId();

                    // Get variant info from serial_id
                    if (serialId != null && !serialId.trim().isEmpty()) {
                        VehicleSerialDTO vehicleSerial = vehicleSerialDAO.getSerialBySerialId(serialId);
                        if (vehicleSerial != null && vehicleSerial.getVariantId() > 0) {
                            VehicleVariantDTO variant = variantDAO.getVariantById(vehicleSerial.getVariantId());
                            if (variant != null) {
                                variantName = variant.getVersionName();
                            }
                        }
                    }
                }

                // Build enriched map
                Map<String, Object> orderMap = new LinkedHashMap<>();
                orderMap.put("orderId", order.getOrderId());
                orderMap.put("customerId", order.getCustomerId());
                orderMap.put("dealerStaffId", order.getDealerStaffId());
                orderMap.put("dealerStaffName", staffName);
                orderMap.put("modelId", order.getModelId());
                orderMap.put("modelName", modelName);
                orderMap.put("variantName", variantName);
                orderMap.put("serialId", serialId);
                orderMap.put("orderDate", order.getOrderDate());
                orderMap.put("status", order.getStatus());
                orderMap.put("detail", detail);

                enrichedOrderList.add(orderMap);
            }

            return enrichedOrderList;
        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    public List<OrderDTO> GetAllOrdersFromDealer(int dealerId) {
        try {
            List<OrderDTO> orderList = orderDAO.getAllOrderFromDealer(dealerId);

            if (orderList == null || orderList.isEmpty()) {
                return Collections.emptyList();
            }

            // Populate order details for each order
            for (OrderDTO order : orderList) {
                OrderDetailDTO detail = orderDetailDAO.getOrderDetailByOrderId(order.getOrderId());
                order.setDetail(detail);
            }

            return orderList;
        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    public List<OrderDTO> getAllApprovedOrdersFromDealers() {
        try {
            return orderDAO.getAllApprovedOrdersFromAllDealers();
        } catch (SQLException | ClassNotFoundException e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<OrderDTO> HandlingGetOrdersByCustomerId(int customerId, int dealerId) throws SQLException, ClassNotFoundException {
        try {
            return orderDAO.getByCustomerIdAndDealerId(customerId, dealerId);
        } catch (SQLException | ClassNotFoundException e) {
            e.printStackTrace();
            return null;
        }
    }

    public boolean updateOrderStatus(int orderId, String newStatus)
            throws SQLException, ClassNotFoundException {

        // Validate trực tiếp trong code — chỉ 3 status hợp lệ
        if (!newStatus.equalsIgnoreCase("pending")
                && !newStatus.equalsIgnoreCase("delivered")
                && !newStatus.equalsIgnoreCase("cancelled")) {
            throw new IllegalArgumentException("Invalid status: " + newStatus);
        }

        try ( Connection conn = DbUtils.getConnection()) {
            conn.setAutoCommit(false);

            boolean success = orderDAO.updateStatus(orderId, newStatus);

            conn.commit();
            return success;
        }
    }

    public List<Map<String, Object>> retrieveOrdersWithConfirmedDetails()
            throws SQLException, ClassNotFoundException {
        return orderDAO.retrieveOrdersWithConfirmedDetails();
    }

    public List<ConfirmationDTO> getAllConfirmation() throws SQLException, ClassNotFoundException {
        return confirmationDAO.viewConfirmations();
    }

    public List<ConfirmationDTO> getConfirmationByOrderDetailId(int orderDetailId)
            throws SQLException, ClassNotFoundException {
        return confirmationDAO.viewConfirmationsByOrderDetailId(orderDetailId);
    }

    public Map<String, Object> getOrderDataForApproval(int orderId) {
        Connection conn = null;
        try {
            conn = DbUtils.getConnection();

            // Step 1: Get order_detail by order_id
            OrderDetailDTO detail = orderDetailDAO.getOrderDetailByOrderId(orderId);
            if (detail == null) {
                System.err.println("No order detail found for order_id: " + orderId);
                return null;
            }

            // Step 2: Get serial_id from order_detail
            String serialId = detail.getSerialId();
            if (serialId == null) {
                System.err.println("No serial_id found in order_detail for order_id: " + orderId);
                return null;
            }

            // Step 3: Get variant_id from vehicle_serial
            VehicleSerialDTO serial = vehicleSerialDAO.getSerialBySerialId(serialId);
            if (serial == null) {
                System.err.println("No serial found for serial_id: " + serialId);
                return null;
            }

            int variantId = serial.getVariantId();

            // Step 4: Get variant details (version_name, color, price, image)
            VehicleVariantDTO variant = variantDAO.getVariantById(variantId);
            if (variant == null) {
                System.err.println("No variant found for variant_id: " + variantId);
                return null;
            }

            // Step 5: Build response map
            Map<String, Object> data = new HashMap<>();
            data.put("versionName", variant.getVersionName());
            data.put("color", variant.getColor());
            data.put("unitPrice", detail.getUnitPrice()); // From order_detail
            data.put("image", variant.getImage());
            data.put("variantId", variant.getVariantId());
            data.put("price", variant.getPrice()); // Variant's base price

            System.out.println("INFO: Retrieved order data for order_id " + orderId
                    + " -> variant_id " + variantId
                    + " (" + variant.getVersionName() + ", " + variant.getColor() + ")");

            return data;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    public Map<String, Object> getCompanyYearlySalesTarget(Integer year) {
        try {
            return orderDAO.calculateCompanyYearlySalesTarget(year);
        } catch (SQLException | ClassNotFoundException e) {
            e.printStackTrace();
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("year", year);
            errorResult.put("totalOrders", 0);
            errorResult.put("totalCars", 0);
            errorResult.put("totalQuantity", 0);
            errorResult.put("totalRevenue", 0.0);
            errorResult.put("error", e.getMessage());
            return errorResult;
        }
    }

    public List<Map<String, Object>> getCompanyMonthlyBreakdown(Integer year) {
        try {
            return orderDAO.calculateCompanyMonthlyBreakdown(year);
        } catch (SQLException | ClassNotFoundException e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

}
