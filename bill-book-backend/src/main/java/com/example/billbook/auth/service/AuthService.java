package com.example.billbook.auth.service;

import com.example.billbook.auth.dto.LoginResponse;
import com.example.billbook.auth.dto.WechatSessionResponse;
import com.example.billbook.user.entity.AppUserEntity;
import com.example.billbook.user.repository.AppUserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Service
public class AuthService {

    private static final String WECHAT_CODE2SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session";

    private final String appid;
    private final String secret;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    @Resource
    private AppUserRepository userRepository;
    @Resource
    private AuthTokenService tokenService;

    @Autowired
    public AuthService(@Value("${wechat.mini-program.appid}") String appid, @Value("${wechat.mini-program.secret}") String secret, ObjectMapper objectMapper) {
        this.appid = appid;
        this.secret = secret;
        this.restClient = RestClient.create();
        this.objectMapper = objectMapper;
    }

    public LoginResponse wechatLogin(String code) {
        String responseBody;
        try {
            responseBody = restClient.get().uri(WECHAT_CODE2SESSION_URL + "?appid={appid}&secret={secret}&js_code={code}&grant_type=authorization_code", appid, secret, code).retrieve().body(String.class);
        } catch (RestClientResponseException exception) {
            throw new IllegalArgumentException("微信登录失败：" + exception.getResponseBodyAsString());
        } catch (RestClientException exception) {
            throw new IllegalArgumentException("微信登录失败：" + exception.getMessage());
        }

        WechatSessionResponse session = parseSession(responseBody);

        if (session == null) {
            throw new IllegalArgumentException("微信登录失败");
        }
        if (session.errcode() != null && session.errcode() != 0) {
            throw new IllegalArgumentException("微信登录失败：" + session.errmsg());
        }
        if (session.openid() == null || session.openid().isBlank()) {
            throw new IllegalArgumentException("微信登录失败：未获取到 openid");
        }

        AppUserEntity user = findOrCreateUser(session.openid(), session.unionid());
        String token = tokenService.buildToken(user.getId(), session.openid());
        return new LoginResponse(user.getId(), session.openid(), token);
    }

    private WechatSessionResponse parseSession(String responseBody) {
        try {
            return objectMapper.readValue(responseBody, WechatSessionResponse.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("微信登录失败：无法解析微信返回：" + responseBody);
        }
    }

    private AppUserEntity findOrCreateUser(String openid, String unionid) {
        return userRepository.findByOpenid(openid).map(user -> {
            userRepository.updateLastLoginAt(user.getId());
            return user;
        }).orElseGet(() -> {
            try {
                return userRepository.create(openid, unionid);
            } catch (DuplicateKeyException exception) {
                return userRepository.findByOpenid(openid).orElseThrow(() -> exception);
            }
        });
    }
}
