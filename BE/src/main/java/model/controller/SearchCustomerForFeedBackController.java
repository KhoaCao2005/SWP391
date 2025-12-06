package model.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import model.dto.CustomerDTO;
import model.service.FeedBackService;
import utils.RequestUtils;
import utils.ResponseUtils;

@WebServlet("/api/staff/searchCustomerForFeedBack")
public class SearchCustomerForFeedBackController extends HttpServlet {

    private final FeedBackService service = new FeedBackService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            Map<String, Object> params = RequestUtils.extractParams(req);
            
            Object nameObj = params.get("name");
            String name = (nameObj == null) ? null : nameObj.toString().trim();

            if (name == null || name.isEmpty()) {
                ResponseUtils.error(resp, "Customer name is required");
                return;
            }

            List<CustomerDTO> customers = service.getAllFeedBackFromCustomerName(name);

            if (customers != null && !customers.isEmpty()) {
                ResponseUtils.success(resp, "Customers found", customers);
            } else {
                ResponseUtils.error(resp, "No customers found with name: " + name);
            }

        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error retrieving customers: " + e.getMessage());
        }
    }
}