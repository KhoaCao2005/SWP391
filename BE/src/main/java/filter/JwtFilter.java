package filter;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import utils.JwtUtil;
import utils.ResponseUtils;
import utils.AuthException;
import utils.AuthRules;

import java.io.IOException;
import java.util.List;

@WebFilter("/*")
public class JwtFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;
        String path = req.getServletPath();

        try {
            if (AuthRules.isPublicPath(path)) {
                chain.doFilter(request, response);
                return;
            }

            String token = JwtUtil.extractToken(req);
            JwtUtil.validateToken(token);

            String username = JwtUtil.extractUsername(token);
            List<String> roles = JwtUtil.extractRoles(token);

            if (!AuthRules.hasRequiredRole(path, roles)) {
                throw new AuthException("Forbidden: insufficient role");
            }

            req.setAttribute("username", username);
            req.setAttribute("roles", roles);

            chain.doFilter(request, response);

        } catch (AuthException e) {
            ResponseUtils.error(resp, e.getMessage());
        }
    }
}
