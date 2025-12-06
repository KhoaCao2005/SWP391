
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * THIS FILTER NEED TO BE REMOVE BEFORE PRODUCT DEPLOY
 * Global Exception Logging Filter
 * Intercepts ALL exceptions from servlets under /api/*
 * This replicates Spring's @ControllerAdvice behavior for raw Servlets
 */
@WebFilter("/api/*")
public class ExceptionLoggingFilter implements Filter {
    
    private static final SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String path = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();
        
        try {
            // Continue with the request
            chain.doFilter(request, response);
            
        } catch (IllegalStateException e) {
            logIllegalStateException(e, path, method);
            handleException(httpResponse, e, 403, "Forbidden");
            
        } catch (RuntimeException e) {
            logRuntimeException(e, path, method);
            handleException(httpResponse, e, 400, "Bad Request");
            
        } catch (ServletException e) {
            // Unwrap ServletException to get the root cause
            Throwable rootCause = e.getRootCause() != null ? e.getRootCause() : e;
            
            if (rootCause instanceof IllegalStateException) {
                logIllegalStateException((IllegalStateException) rootCause, path, method);
                handleException(httpResponse, rootCause, 403, "Forbidden");
            } else if (rootCause instanceof RuntimeException) {
                logRuntimeException((RuntimeException) rootCause, path, method);
                handleException(httpResponse, rootCause, 400, "Bad Request");
            } else {
                logGeneralException(rootCause, path, method);
                handleException(httpResponse, rootCause, 500, "Internal Server Error");
            }
            
        } catch (Exception e) {
            logGeneralException(e, path, method);
            handleException(httpResponse, e, 500, "Internal Server Error");
        }
    }
    
    private void handleException(HttpServletResponse response, Throwable e, int status, String error) 
            throws IOException {
        
        if (!response.isCommitted()) {
            response.setStatus(status);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            
            String json = String.format(
                "{\"timestamp\":\"%s\",\"status\":%d,\"error\":\"%s\",\"message\":\"%s\"}",
                formatter.format(new Date()),
                status,
                error,
                escapeJson(e.getMessage() != null ? e.getMessage() : "No message available")
            );
            
            response.getWriter().write(json);
        }
    }
    
    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }
    
    private void logGeneralException(Throwable e, String path, String method) {
        System.err.println("╔════════════════════════════════════════════════╗");
        System.err.println("║  GLOBAL EXCEPTION HANDLER CAUGHT EXCEPTION     ║");
        System.err.println("╚════════════════════════════════════════════════╝");
        System.err.println("Exception Type: " + e.getClass().getName());
        System.err.println("Message: " + e.getMessage());
        System.err.println("Method: " + method);
        System.err.println("Path: " + path);
        System.err.println("Timestamp: " + formatter.format(new Date()));
        System.err.println("Stack Trace:");
        e.printStackTrace();
        System.err.println("╚════════════════════════════════════════════════╝\n");
    }
    
    private void logIllegalStateException(IllegalStateException e, String path, String method) {
        System.err.println("╔════════════════════════════════════════════════╗");
        System.err.println("║  PERMISSION DENIED                             ║");
        System.err.println("╚════════════════════════════════════════════════╝");
        System.err.println("Message: " + e.getMessage());
        System.err.println("Method: " + method);
        System.err.println("Path: " + path);
        System.err.println("Timestamp: " + formatter.format(new Date()));
        System.err.println("Stack Trace:");
        e.printStackTrace();
        System.err.println("╚════════════════════════════════════════════════╝\n");
    }
    
    private void logRuntimeException(RuntimeException e, String path, String method) {
        System.err.println("╔════════════════════════════════════════════════╗");
        System.err.println("║  RUNTIME EXCEPTION                             ║");
        System.err.println("╚════════════════════════════════════════════════╝");
        System.err.println("Message: " + e.getMessage());
        System.err.println("Method: " + method);
        System.err.println("Path: " + path);
        System.err.println("Timestamp: " + formatter.format(new Date()));
        System.err.println("Stack Trace:");
        e.printStackTrace();
        System.err.println("╚════════════════════════════════════════════════╝\n");
    }
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        System.out.println("╔════════════════════════════════════════════════╗");
        System.out.println("║  Exception Logging Filter Initialized          ║");
        System.out.println("║  Monitoring: /api/*                            ║");
        System.out.println("╚════════════════════════════════════════════════╝");
    }
    
    @Override
    public void destroy() {
        System.out.println("Exception Logging Filter Destroyed");
    }
}