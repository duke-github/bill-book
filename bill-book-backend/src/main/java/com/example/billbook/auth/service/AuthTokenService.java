package com.example.billbook.auth.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class AuthTokenService {

    public String buildToken(Long userId, String openid) {
        String rawToken = "wechat:" + userId + ":" + openid;
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(rawToken.getBytes(StandardCharsets.UTF_8));
    }

    public Long parseUserId(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("请先登录");
        }
        String token = authorization.substring("Bearer ".length()).trim();
        try {
            String rawToken = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
            String[] parts = rawToken.split(":");
            if (parts.length != 3 || !"wechat".equals(parts[0])) {
                throw new IllegalArgumentException("登录状态无效");
            }
            return Long.valueOf(parts[1]);
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("登录状态无效");
        }
    }
}
