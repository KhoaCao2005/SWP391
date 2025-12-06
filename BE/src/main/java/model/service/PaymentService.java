package model.service;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import model.dao.*;
import model.dto.*;

public class PaymentService {

    private final PaymentDAO paymentDAO = new PaymentDAO();
    private final InstallmentPlanDAO installDAO = new InstallmentPlanDAO();
    private final OrderDAO orderDAO = new OrderDAO();
    private final OrderDetailDAO orderDetailDAO = new OrderDetailDAO();
    private final UserAccountDAO userAccountDAO = new UserAccountDAO();
    private final DealerDAO dealerDAO = new DealerDAO();
    private final DealerPromotionDAO dealerPromoDAO = new DealerPromotionDAO();
    private final CustomerDAO customerDAO = new CustomerDAO();
    private final VehicleModelDAO modelDAO = new VehicleModelDAO();
    private final VehicleVariantDAO variantDAO = new VehicleVariantDAO();
    private final VehicleSerialDAO serialDAO = new VehicleSerialDAO();

    public PaymentDTO processPayment(int orderId, String method, InstallmentPlanDTO plan, Integer promoId) throws ClassNotFoundException, SQLException {
        System.out.println("DEBUG: Starting payment processing for order_id = " + orderId);

        OrderDTO order = orderDAO.getById(orderId);
        if (order == null) {
            System.err.println("ERROR: Order not found for order_id = " + orderId);
            throw new IllegalArgumentException("Order not found for order_id = " + orderId);
        }
        System.out.println("DEBUG: Order found - customer_id = " + order.getCustomerId());

        // Check if customer ID is valid (not 0)
        if (order.getCustomerId() <= 0) {
            System.err.println("ERROR: Invalid customer ID (" + order.getCustomerId() + ") for order: " + orderId);
            throw new IllegalArgumentException("Invalid customer ID for order: " + orderId);
        }

        // Check if payment already exists
        System.out.println("DEBUG: Checking for existing payment...");
        PaymentDTO existingPayment = paymentDAO.findPaymentByOrderId(orderId);
        if (existingPayment != null) {
            System.err.println("ERROR: Payment already exists for Order ID: " + orderId + ", Payment ID: " + existingPayment.getPaymentId());
            throw new IllegalStateException("Payment already exists for Order ID: " + orderId);
        }
        System.out.println("DEBUG: No existing payment found");

        List<OrderDetailDTO> detail = orderDetailDAO.getOrderDetailListByOrderId(orderId);
        if (detail == null) {
            return null;
        }
        order.setDetails(detail);

        double totalAmount = 0.0;
        for (OrderDetailDTO d : detail) {
            try {
                int quantity = Integer.parseInt(d.getQuantity());
                double unitPrice = d.getUnitPrice();
                totalAmount += quantity * unitPrice;
            } catch (NumberFormatException e) {
                e.printStackTrace();
                return null;
            }
        }

        // Apply promotion if promoId is provided
        if (promoId != null && promoId > 0) {
            System.out.println("DEBUG: Promotion ID provided: " + promoId);

            // Get dealer information from order
            UserAccountDTO staff = userAccountDAO.getUserById(order.getDealerStaffId());
            if (staff != null) {
                DealerDTO dealer = dealerDAO.GetDealerById(staff.getDealerId());
                if (dealer != null) {
                    System.out.println("DEBUG: Dealer found - dealer_id = " + dealer.getDealerId());

                    // Get all promotions for this dealer
                    List<PromotionDTO> dealerPromotions = dealerPromoDAO.getPromotionsByDealerId(dealer.getDealerId());

                    // Find the specific promotion and validate it belongs to this dealer
                    PromotionDTO selectedPromo = null;
                    for (PromotionDTO promo : dealerPromotions) {
                        if (promo.getPromoId() == promoId) {
                            selectedPromo = promo;
                            break;
                        }
                    }

                    if (selectedPromo == null) {
                        System.err.println("ERROR: Promotion ID " + promoId + " not found for dealer " + dealer.getDealerId());
                        throw new IllegalArgumentException("Invalid promotion: Promotion does not belong to this dealer");
                    }

                    System.out.println("DEBUG: Valid promotion found for dealer");

                    // Check if promotion is currently active
                    LocalDate now = LocalDate.now();
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

                    try {
                        if (selectedPromo.getStartDate() == null || selectedPromo.getEndDate() == null) {
                            System.err.println("ERROR: Promotion has invalid dates");
                            throw new IllegalArgumentException("Promotion has invalid date range");
                        }

                        LocalDate start = LocalDate.parse(selectedPromo.getStartDate(), formatter);
                        LocalDate end = LocalDate.parse(selectedPromo.getEndDate(), formatter);

                        if (!((now.isEqual(start) || now.isAfter(start)) && (now.isEqual(end) || now.isBefore(end)))) {
                            System.err.println("ERROR: Promotion is not active during current date");
                            throw new IllegalArgumentException("Promotion is not currently active");
                        }

                        // Apply discount
                        String discountStr = selectedPromo.getDiscountRate();
                        if (discountStr != null && !discountStr.trim().isEmpty()) {
                            discountStr = discountStr.replace("%", "").trim();
                            double discount = Double.parseDouble(discountStr);

                            // Normalize discount to percentage (0-100)
                            if (discount > 0 && discount < 1) {
                                discount = discount * 100;
                            }

                            double discountAmount = totalAmount * (discount / 100.0);
                            totalAmount = totalAmount - discountAmount;

                            System.out.println("DEBUG: Discount applied - " + discount + "%, Amount saved: " + discountAmount);
                            System.out.println("DEBUG: New total amount: " + totalAmount);
                        }

                    } catch (DateTimeParseException ex) {
                        System.err.println("ERROR: Failed to parse promotion dates");
                        throw new IllegalArgumentException("Invalid promotion date format");
                    } catch (NumberFormatException ex) {
                        System.err.println("ERROR: Failed to parse discount rate");
                        throw new IllegalArgumentException("Invalid discount rate format");
                    }

                } else {
                    System.err.println("ERROR: Dealer not found for staff");
                    throw new IllegalArgumentException("Dealer information not found");
                }
            } else {
                System.err.println("ERROR: Staff not found for order");
                throw new IllegalArgumentException("Staff information not found");
            }
        } else {
            System.out.println("DEBUG: No promotion applied");
        }

        PaymentDTO payment = new PaymentDTO();
        payment.setOrderId(orderId);
        payment.setAmount(totalAmount);
        payment.setPaymentDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        payment.setMethod(method != null ? method : "TT");

        boolean paymentCreated = paymentDAO.create(payment);
        if (!paymentCreated) {
            return null;
        }

        if (!"TT".equalsIgnoreCase(method)) {
            if (plan == null) {
                plan = new InstallmentPlanDTO();
                plan.setInterestRate("0");
                plan.setTermMonth("12");
                plan.setStatus("Active");
            }

            if (plan.getMonthlyPay() == null || "0".equals(plan.getMonthlyPay()) || "".equals(plan.getMonthlyPay())) {
                try {
                    int termMonths = 12;
                    if (plan.getTermMonth() != null) {
                        termMonths = Integer.parseInt(plan.getTermMonth());
                    }
                    if (termMonths <= 0) {
                        termMonths = 1;
                    }
                    double monthlyPayment = totalAmount / termMonths;
                    plan.setMonthlyPay(String.valueOf(monthlyPayment));
                } catch (NumberFormatException e) {
                    plan.setMonthlyPay(String.valueOf(totalAmount));
                }
            }

            plan.setPaymentId(payment.getPaymentId());
            InstallmentPlanDTO createdPlan = installDAO.create(plan);
            payment.setInstallmentPlan(createdPlan);
        }

        return payment;
    }

    public InstallmentPlanDTO updateInstallmentPlanStatus(InstallmentPlanDTO plan) {
        try {
            boolean updated = installDAO.updateStatus(plan); // updates status and term_month
            if (updated) {
                // Reload the full updated record from DB
                return installDAO.findById(plan.getPlanId());
            }
            return null;
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
            return null;
        }
    }

    public PaymentDTO getPaymentByOrderId(int orderId) {
        try {
            return paymentDAO.findPaymentById(orderId);
        } catch (IndexOutOfBoundsException e) {
            System.out.println("No payment found for Order ID " + orderId);
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<Map<String, Object>> getCustomersWithActiveInstallmentsByDealer(int dealerId) {
        List<Map<String, Object>> responseList = new ArrayList<>();
        try {
            List<InstallmentPlanDTO> plans = installDAO.getActiveOrOverduePlans();
            if (plans == null || plans.isEmpty()) {
                return responseList;
            }

            for (InstallmentPlanDTO plan : plans) {
                PaymentDTO payment = paymentDAO.findPaymentById(plan.getPaymentId());
                if (payment == null) {
                    continue;
                }

                OrderDTO order = orderDAO.getById(payment.getOrderId());
                if (order == null) {
                    continue;
                }

                // Check if order belongs to the dealer
                UserAccountDTO dealerStaff = userAccountDAO.getUserById(order.getDealerStaffId());
                if (dealerStaff == null || dealerStaff.getDealerId() != dealerId) {
                    continue;
                }

                // Get dealer name
                String dealerName = "Unknown";
                DealerDTO dealer = dealerDAO.GetDealerById(dealerId);
                if (dealer != null) {
                    dealerName = dealer.getDealerName();
                }

                int customerId = order.getCustomerId();
                if (customerId <= 0) {
                    continue;
                }

                List<CustomerDTO> customerList = customerDAO.findById(customerId);
                if (customerList == null || customerList.isEmpty()) {
                    continue;
                }
                CustomerDTO customer = customerList.get(0);

                // Get model information
                int modelId = order.getModelId();
                String modelName = "Unknown";
                List<VehicleModelDTO> modelList = modelDAO.viewVehicleModelById(modelId);
                if (modelList != null && !modelList.isEmpty()) {
                    modelName = modelList.get(0).getModelName();
                }

                // Get order detail for serial_id
                OrderDetailDTO detail = orderDetailDAO.getOrderDetailByOrderId(order.getOrderId());
                String serialId = null;
                Integer variantId = null;
                String variantName = null;

                if (detail != null) {
                    serialId = detail.getSerialId();

                    if (serialId != null && !serialId.trim().isEmpty()) {
                        VehicleSerialDTO vehicleSerial = serialDAO.getSerialBySerialId(serialId);
                        if (vehicleSerial != null && vehicleSerial.getVariantId() > 0) {
                            variantId = vehicleSerial.getVariantId();
                            VehicleVariantDTO variant = variantDAO.getVariantById(variantId);
                            if (variant != null) {
                                variantName = variant.getVersionName();
                            }
                        }
                    }
                }

                // Parse values
                double monthlyPay = 0.0;
                int remainingTermMonth = 0;

                try {
                    monthlyPay = Double.parseDouble(plan.getMonthlyPay());
                } catch (NumberFormatException e) {
                    System.err.println("Invalid monthlyPay for plan " + plan.getPlanId());
                }

                try {
                    remainingTermMonth = Integer.parseInt(plan.getTermMonth());
                } catch (NumberFormatException e) {
                    System.err.println("Invalid termMonth for plan " + plan.getPlanId());
                }

                // ===== CORRECTED CALCULATION LOGIC =====
                // Calculate original term from payment.getAmount() (total with interest)
                // payment.getAmount() should contain the full installment amount
                int originalTermMonth = 0;
                if (monthlyPay > 0) {
                    originalTermMonth = (int) Math.round(payment.getAmount() / monthlyPay);
                }

                // Fallback: if calculation gives unreasonable result, use remaining term
                if (originalTermMonth <= 0 || originalTermMonth < remainingTermMonth) {
                    originalTermMonth = remainingTermMonth;
                }

                // Calculate amounts based on monthly payment schedule
                double totalAmountWithInterest = monthlyPay * originalTermMonth;
                double outstanding = monthlyPay * remainingTermMonth;
                int paidMonths = originalTermMonth - remainingTermMonth;
                double paidAmount = monthlyPay * paidMonths;

                // Ensure non-negative values
                outstanding = Math.max(0, outstanding);
                paidAmount = Math.max(0, paidAmount);

                // If remaining term is 0, plan is fully paid
                if (remainingTermMonth <= 0) {
                    outstanding = 0.0;
                    paidAmount = totalAmountWithInterest;
                }

                // Format numbers to avoid scientific notation
                DecimalFormat df = new DecimalFormat("0.00");
                df.setMaximumFractionDigits(2);
                df.setMinimumFractionDigits(0);
                df.setGroupingUsed(false);

                Map<String, Object> map = new LinkedHashMap<>();

                // Customer info
                map.put("customerId", customer.getCustomerId());
                map.put("name", customer.getName());
                map.put("address", customer.getAddress());
                map.put("email", customer.getEmail());
                map.put("phoneNumber", customer.getPhoneNumber());

                // Vehicle info
                map.put("modelId", modelId);
                map.put("modelName", modelName);
                map.put("variantId", variantId);
                map.put("variantName", variantName);
                map.put("serialId", serialId);

                // Dealer info
                map.put("dealerId", dealerId);
                map.put("dealerName", dealerName);

                // Installment plan info
                map.put("planId", plan.getPlanId());
                map.put("interestRate", plan.getInterestRate());
                map.put("originalTermMonth", originalTermMonth);  // Add this
                map.put("remainingTermMonth", remainingTermMonth); // Rename for clarity
                map.put("paidMonths", paidMonths);                // Add this
                map.put("monthlyPay", Double.parseDouble(df.format(monthlyPay)));
                map.put("status", plan.getStatus());

                // Payment info - format to avoid scientific notation
                map.put("paymentId", payment.getPaymentId());
                map.put("orderId", payment.getOrderId());
                map.put("totalAmount", Double.parseDouble(df.format(totalAmountWithInterest)));
                map.put("paymentDate", payment.getPaymentDate());
                map.put("method", payment.getMethod());
                map.put("outstandingAmount", Double.parseDouble(df.format(outstanding)));
                map.put("paidAmount", Double.parseDouble(df.format(paidAmount)));

                responseList.add(map);
            }

        } catch (Exception e) {
            System.err.println("ERROR in getCustomersWithActiveInstallmentsByDealer: " + e.getMessage());
            e.printStackTrace();
        }
        return responseList;
    }

    public List<Map<String, Object>> getCustomersWithTTStatusByDealer(int dealerId) {
        List<Map<String, Object>> responseList = new ArrayList<>();
        try {
            List<PaymentDTO> allPayments = paymentDAO.getAllPayment();
            if (allPayments == null || allPayments.isEmpty()) {
                return responseList;
            }

            // Get dealer name once (optimization)
            String dealerName = "Unknown";
            DealerDTO dealer = dealerDAO.GetDealerById(dealerId);
            if (dealer != null) {
                dealerName = dealer.getDealerName();
            }

            for (PaymentDTO payment : allPayments) {
                if (!"TT".equalsIgnoreCase(payment.getMethod())) {
                    continue;
                }

                OrderDTO order = orderDAO.getById(payment.getOrderId());
                if (order == null) {
                    continue;
                }

                // 🔍 Check dealer ownership (same logic as installment)
                UserAccountDTO dealerStaff = userAccountDAO.getUserById(order.getDealerStaffId());
                if (dealerStaff == null || dealerStaff.getDealerId() != dealerId) {
                    continue; // skip if not from this dealer
                }

                int customerId = order.getCustomerId();
                if (customerId <= 0) {
                    continue;
                }

                List<CustomerDTO> customerList = customerDAO.findById(customerId);
                if (customerList == null || customerList.isEmpty()) {
                    continue;
                }

                CustomerDTO customer = customerList.get(0);

                // Get model information
                int modelId = order.getModelId();
                String modelName = "Unknown";
                List<VehicleModelDTO> modelList = modelDAO.viewVehicleModelById(modelId);
                if (modelList != null && !modelList.isEmpty()) {
                    modelName = modelList.get(0).getModelName();
                }

                // Get order detail for serial_id and variant info
                OrderDetailDTO detail = orderDetailDAO.getOrderDetailByOrderId(order.getOrderId());
                String serialId = null;
                Integer variantId = null;
                String variantName = null;

                if (detail != null) {
                    serialId = detail.getSerialId();

                    // Get variant info from serial_id
                    if (serialId != null && !serialId.trim().isEmpty()) {
                        VehicleSerialDTO vehicleSerial = serialDAO.getSerialBySerialId(serialId);
                        if (vehicleSerial != null && vehicleSerial.getVariantId() > 0) {
                            variantId = vehicleSerial.getVariantId();
                            VehicleVariantDTO variant = variantDAO.getVariantById(variantId);
                            if (variant != null) {
                                variantName = variant.getVersionName();
                            }
                        }
                    }
                }

                // Get order details for calculated total
                List<OrderDetailDTO> orderDetails = orderDetailDAO.getOrderDetailListByOrderId(payment.getOrderId());
                double calculatedTotal = 0.0;
                if (orderDetails != null && !orderDetails.isEmpty()) {
                    for (OrderDetailDTO od : orderDetails) {
                        try {
                            int quantity = Integer.parseInt(od.getQuantity());
                            double unitPrice = od.getUnitPrice();
                            calculatedTotal += quantity * unitPrice;
                        } catch (NumberFormatException e) {
                            e.printStackTrace();
                        }
                    }
                }

                double totalAmount = payment.getAmount();

                Map<String, Object> map = new LinkedHashMap<>();
                // Customer info
                map.put("customerId", customer.getCustomerId());
                map.put("name", customer.getName());
                map.put("address", customer.getAddress());
                map.put("email", customer.getEmail());
                map.put("phoneNumber", customer.getPhoneNumber());

                // Vehicle info
                map.put("modelId", modelId);
                map.put("modelName", modelName);
                map.put("variantId", variantId);
                map.put("variantName", variantName);
                map.put("serialId", serialId);

                // Dealer info
                map.put("dealerId", dealerId);
                map.put("dealerName", dealerName);

                // Payment info
                map.put("paymentId", payment.getPaymentId());
                map.put("orderId", payment.getOrderId());
                map.put("totalAmount", totalAmount);
                map.put("calculatedTotal", calculatedTotal);
                map.put("paymentDate", payment.getPaymentDate());
                map.put("method", payment.getMethod());
                map.put("paidAmount", totalAmount);

                responseList.add(map);
            }

        } catch (Exception e) {
            System.err.println("ERROR in getCustomersWithTTStatusByDealer: " + e.getMessage());
            e.printStackTrace();
        }
        return responseList;
    }

    public List<Map<String, Object>> getCustomerDebtSummaryByDealer(int dealerId) {
        List<Map<String, Object>> responseList = new ArrayList<>();

        try {
            Map<Integer, Map<String, Object>> customerDebtMap = new LinkedHashMap<>();

            List<InstallmentPlanDTO> plans = installDAO.getActiveOrOverduePlans();
            if (plans == null || plans.isEmpty()) {
                return responseList;
            }

            for (InstallmentPlanDTO plan : plans) {

                PaymentDTO payment = paymentDAO.findPaymentById(plan.getPaymentId());
                if (payment == null) {
                    continue;
                }

                OrderDTO order = orderDAO.getById(payment.getOrderId());
                if (order == null) {
                    continue;
                }

                // Check dealer ownership
                UserAccountDTO dealerStaff = userAccountDAO.getUserById(order.getDealerStaffId());
                if (dealerStaff == null || dealerStaff.getDealerId() != dealerId) {
                    continue;
                }

                int customerId = order.getCustomerId();
                if (customerId <= 0) {
                    continue;
                }

                List<CustomerDTO> customerList = customerDAO.findById(customerId);
                if (customerList == null || customerList.isEmpty()) {
                    continue;
                }

                CustomerDTO customer = customerList.get(0);

                // Safe parsing
                BigDecimal monthlyPay = new BigDecimal(plan.getMonthlyPay() == null ? "0" : plan.getMonthlyPay());
                int remainingTerm = parseIntSafe(plan.getTermMonth());
                BigDecimal principal = BigDecimal.valueOf(payment.getAmount());

                // Compute original term
                int originalTerm = (monthlyPay.compareTo(BigDecimal.ZERO) > 0)
                        ? principal.divide(monthlyPay, 0, BigDecimal.ROUND_HALF_UP).intValue()
                        : remainingTerm;

                if (originalTerm < remainingTerm) {
                    originalTerm = remainingTerm;
                }

                // Compute totals
                BigDecimal totalAmount = monthlyPay.multiply(BigDecimal.valueOf(originalTerm));
                int paidMonths = Math.max(0, originalTerm - remainingTerm);
                BigDecimal paidAmount = monthlyPay.multiply(BigDecimal.valueOf(paidMonths));
                BigDecimal outstanding = monthlyPay.multiply(BigDecimal.valueOf(remainingTerm));

                if (remainingTerm <= 0) {
                    outstanding = BigDecimal.ZERO;
                    paidAmount = totalAmount;
                }

                // Add or accumulate per customer
                Map<String, Object> summary = customerDebtMap.get(customerId);
                if (summary == null) {
                    summary = new LinkedHashMap<>();
                    summary.put("customerId", customer.getCustomerId());
                    summary.put("name", customer.getName());
                    summary.put("email", customer.getEmail());
                    summary.put("phoneNumber", customer.getPhoneNumber());
                    summary.put("dealerId", dealerId);

                    summary.put("totalOutstandingDebt", outstanding.toPlainString());
                    summary.put("totalPaidAmount", paidAmount.toPlainString());
                    summary.put("totalPlans", 1);

                    customerDebtMap.put(customerId, summary);

                } else {
                    BigDecimal currentDebt = new BigDecimal(summary.get("totalOutstandingDebt").toString());
                    BigDecimal currentPaid = new BigDecimal(summary.get("totalPaidAmount").toString());
                    int plansCount = (int) summary.get("totalPlans");

                    BigDecimal updatedDebt = currentDebt.add(outstanding);
                    BigDecimal updatedPaid = currentPaid.add(paidAmount);

                    summary.put("totalOutstandingDebt", updatedDebt.toPlainString());
                    summary.put("totalPaidAmount", updatedPaid.toPlainString());
                    summary.put("totalPlans", plansCount + 1);
                }
            }

            responseList.addAll(customerDebtMap.values());

        } catch (Exception e) {
            System.err.println("ERROR in getCustomerDebtSummaryByDealer: " + e.getMessage());
            e.printStackTrace();
        }

        return responseList;
    }

    private int parseIntSafe(String value) {
        try {
            return Integer.parseInt(value);
        } catch (Exception e) {
            return 0;
        }
    }

}
