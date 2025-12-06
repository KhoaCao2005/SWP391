package model.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import model.service.FeedBackService;
import utils.RequestUtils;
import utils.ResponseUtils;

@WebServlet("/api/staff/deleteFeedBackByFeedBackId")
public class DeleteFeedBackByFeedBackIdController extends HttpServlet {

    private final FeedBackService service = new FeedBackService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        try {
            Map<String, Object> params = RequestUtils.extractParams(req);
            
            Object idObj = params.get("id");
            String idParam = (idObj == null) ? null : idObj.toString();


            if (idParam == null || idParam.trim().isEmpty()) {
                ResponseUtils.error(resp, "Feedback ID is required");
                return;
            }

            int feedbackId = Integer.parseInt(idParam);
            boolean isDeleted = service.deleteFeedBack(feedbackId);

            if (isDeleted) {
                ResponseUtils.success(resp, "Feedback deleted successfully", feedbackId);
            } else {
                ResponseUtils.error(resp, "Failed to delete feedback. ID may not exist.");
            }
        } catch (NumberFormatException e) {
            ResponseUtils.error(resp, "Invalid feedback ID format");
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtils.error(resp, "Error deleting feedback: " + e.getMessage());
        }
    }
}