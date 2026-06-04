package com.example.billbook.user.repository;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.example.billbook.user.entity.AppUserEntity;
import com.example.billbook.user.mapper.AppUserMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public class AppUserRepository {

    @Resource
    private AppUserMapper mapper;

    public Optional<AppUserEntity> findByOpenid(String openid) {
        LambdaQueryWrapper<AppUserEntity> wrapper = new LambdaQueryWrapper<AppUserEntity>()
                .eq(AppUserEntity::getOpenid, openid)
                .eq(AppUserEntity::getDeleted, false);
        return Optional.ofNullable(mapper.selectOne(wrapper));
    }

    public AppUserEntity create(String openid, String unionid) {
        AppUserEntity entity = new AppUserEntity();
        entity.setOpenid(openid);
        entity.setUnionid(unionid);
        entity.setLastLoginAt(LocalDateTime.now());
        entity.setDeleted(false);
        mapper.insert(entity);
        return entity;
    }

    public void updateLastLoginAt(Long id) {
        LambdaUpdateWrapper<AppUserEntity> wrapper = new LambdaUpdateWrapper<AppUserEntity>()
                .eq(AppUserEntity::getId, id)
                .set(AppUserEntity::getLastLoginAt, LocalDateTime.now())
                .set(AppUserEntity::getUpdatedAt, LocalDateTime.now());
        mapper.update(null, wrapper);
    }
}
