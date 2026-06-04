package com.example.billbook.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record WechatSessionResponse(String openid, @JsonProperty("session_key") String sessionKey, String unionid,
                                    Integer errcode, String errmsg) {
}
