package io.dataease.auth.config;


import io.dataease.auth.service.ShiroService;
import org.apache.shiro.mgt.DefaultSessionStorageEvaluator;
import org.apache.shiro.mgt.DefaultSubjectDAO;
import org.apache.shiro.spring.LifecycleBeanPostProcessor;
import org.apache.shiro.spring.security.interceptor.AuthorizationAttributeSourceAdvisor;
import org.apache.shiro.spring.web.ShiroFilterFactoryBean;
import org.apache.shiro.web.mgt.DefaultWebSecurityManager;
import org.springframework.aop.framework.autoproxy.DefaultAdvisorAutoProxyCreator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import javax.servlet.Filter;
import java.util.LinkedHashMap;
import java.util.Map;
import io.dataease.auth.filter.*;
import org.springframework.context.annotation.DependsOn;

@Configuration   //表明类为配置类
public class ShiroConfig {

    @Bean("securityManager")  //形成了DefaultWebSecurityManager安全管理器，
    public DefaultWebSecurityManager getManager(F2CRealm f2cRealm) {
        DefaultWebSecurityManager manager = new DefaultWebSecurityManager();
        // 使用自己的realm，给manager设置realms
        manager.setRealm(f2cRealm);

        /*
         * 关闭shiro自带的session，详情见文档
         * http://shiro.apache.org/session-management.html#SessionManagement-StatelessApplications%28Sessionless%29
         */
        DefaultSubjectDAO subjectDAO = new DefaultSubjectDAO();
        DefaultSessionStorageEvaluator defaultSessionStorageEvaluator = new DefaultSessionStorageEvaluator();
        defaultSessionStorageEvaluator.setSessionStorageEnabled(false);
        subjectDAO.setSessionStorageEvaluator(defaultSessionStorageEvaluator);
        manager.setSubjectDAO(subjectDAO);

        return manager;
    }

    @Bean("shiroFilter")
    public ShiroFilterFactoryBean factory(DefaultWebSecurityManager securityManager, ShiroService shiroService) { //这里声明了securityManager，会自动去工厂中寻找@bean注解的securityManager
        ShiroFilterFactoryBean factoryBean = new ShiroFilterFactoryBean();
        // 添加自己的过滤器并且取名为jwt
        Map<String, Filter> filterMap = new LinkedHashMap<>();
//        filterMap.put("f2cPerms", new F2CPermissionsFilter());
        filterMap.put("jwt", new JWTFilter());
        filterMap.put("logout", new F2CLogoutFilter());
        filterMap.put("link", new F2CLinkFilter());
        filterMap.put("doc", new F2CDocFilter());
        //给过滤器设置securityManager
        factoryBean.setSecurityManager(securityManager);
        factoryBean.setLoginUrl("/login");

        factoryBean.setUnauthorizedUrl("/login");

        factoryBean.setFilterChainDefinitionMap(shiroService.loadFilterChainDefinitionMap()); //告诉shiro哪些资源是受限的，哪些是公共的
        factoryBean.setFilters(filterMap);
        return factoryBean;
    }

    /**
     * 下面的代码是添加注解支持
     */
    @Bean
    @DependsOn("lifecycleBeanPostProcessor")
    public DefaultAdvisorAutoProxyCreator defaultAdvisorAutoProxyCreator() {
        DefaultAdvisorAutoProxyCreator defaultAdvisorAutoProxyCreator = new DefaultAdvisorAutoProxyCreator();
        defaultAdvisorAutoProxyCreator.setProxyTargetClass(true);
        return defaultAdvisorAutoProxyCreator;
    }

    @Bean
    public LifecycleBeanPostProcessor lifecycleBeanPostProcessor() {
        return new LifecycleBeanPostProcessor();
    }

    @Bean
    public AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor(DefaultWebSecurityManager securityManager) {
        AuthorizationAttributeSourceAdvisor advisor = new AuthorizationAttributeSourceAdvisor();
        advisor.setSecurityManager(securityManager);
        return advisor;
    }
}
