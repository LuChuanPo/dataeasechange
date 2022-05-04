import router from '@/router'
import store from './store'
// import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'
import { buildMenus } from '@/api/system/menu'
import { filterAsyncRouter } from '@/store/modules/permission'
// import bus from './utils/bus'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/', '/login', '/401', '/404', '/delink', '/nolic'] // no redirect whitelist


router.beforeEach(async(to, from, next) => {
  localStorage.setItem('Authorization', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwidXNlcklkIjoxfQ.WMm1Rt_9WSuOiABJF6HK9e3XePsPkxpGx-axefb6AMU')
  loadMenus(next, to)
  next()


})
//全局前置路由守卫,----初始化的时候被调用或者每次路由切换之前被调用
// router.beforeEach(async(to, from, next) => {
//   // start progress bar
//   //加载进度条,浏览器上方蓝色的进度条
//   NProgress.start()
//
//   // set page title
//   document.title = getPageTitle(to.meta.title)
//
//   // determine whether the user has logged in
//   //从cookies里面获取到Token,怎么存到cookies里面的 ? :login.vue请求store里面的actions,里面有user/login,在里面就是 api里面的login方法,带着参数请求后端,验证登录成功后,设置返回体header,将token设置在里面,然后login方法then,将token设置在cookies
//   const hasToken = getToken()
//   if (hasToken) {
//     if (to.path === '/login') {
//       // if is logged in, redirect to the home page,如果要跳转到登陆页面,界面会重定向到首页,这种场景不是应用于退出登录的，一般是用于因为有人在路径当中直接输入/login来进行路由跳转
//       next({ path: '/' })
//       NProgress.done()
//     } else {
//       // 否则路由要跳转到其他界面，比如首页,
//       // 去vuex仓库拿取用户名字
//       const hasGetUserInfo = store.getters.name
//       //如果拿到了,或者去的页面是下面中的,放行
//       if (hasGetUserInfo || to.path.indexOf('/preview/') > -1 || to.path.indexOf('/delink') > -1 || to.path.indexOf('/nolic') > -1) {
//         next()
//         //将store里面的目前路径设置
//         store.dispatch('permission/setCurrentPath', to.path)
//       } else {
//         if (store.getters.roles.length === 0) { // 判断当前用户是否已拉取完user_info信息,如果store/user里面的roles[]是空的,说明没有拉取完毕
//           // get user info
//           store.dispatch('user/getInfo').then(() => {  //提交用户信息到state
//             store.dispatch('lic/getLicInfo').then(() => {//lisence验证,暂时不管,这里是无论这个方法怎么样,都会加载菜单
//               loadMenus(next, to)//加载菜单
//             }).catch(() => {
//               loadMenus(next, to)
//             })
//           }).catch(() => {
//             store.dispatch('user/logout').then(() => { //对应user/getInfo的,退出登录,重置路由,删除当前用户的Token
//               location.reload() // 为了重新实例化vue-router对象 避免bug
//             })
//           })
//         } else if (store.getters.loadMenus) {
//
//           store.dispatch('user/updateLoadMenus')// 修改成false，防止死循环
//           store.dispatch('lic/getLicInfo').then(() => {
//             loadMenus(next, to)
//           }).catch(() => {
//             loadMenus(next, to)
//           })
//         } else {
//           next()
//         }
//       }
//     }
//   } else {
//     /* has no token*/
//
//     if (whiteList.indexOf(to.path) !== -1) {
//       // in the free login whitelist, go directly,如果要跳转的路由在白名单内,直接放行
//       next()
//     } else {
//       // other pages that do not have permission to access are redirected to the login page.  啥也没有,滚回登录页
//       next(`/login?redirect=${to.path}`)
//
//       NProgress.done()
//     }
//   }
// })

//动态路由相关的
export const loadMenus = (next, to) => {
  //向后台请求菜单数据
  buildMenus().then(res => {
    const datas = res.data  //菜单数据
    console.log('路由菜单======', datas)
    // disableSomeMenu(datas)//对数据做了一些修改或者说是过滤
    // const filterDatas = filterRouter(datas)
    const asyncRouter = filterAsyncRouter(datas)// 遍历后台传来的路由字符串，转换为组件对象
    console.log('转换之后的',asyncRouter)
    asyncRouter.push({ path: '*', redirect: '/404', hidden: true })
    store.dispatch('permission/GenerateRoutes', asyncRouter).then(() => { // 存储路由
      router.addRoutes(asyncRouter)
/*      if (pathValid(to.path, asyncRouter)) {
        next({ ...to, replace: true })
      } else {
        next('/')
      }*/
    })
  })
}
const disableSomeMenu = datas => {
  datas.forEach(menu => {
    if (menu.name === 'system') {
      menu.children.forEach(item => {
        if (item.name === 'sys-task') {
          item.children = [item.children[0]]
        }
      })
    }
  })
}

/**
 * 验证path是否有效
 * @param {*} path
 * @param {*} routers
 * @returns
 */
const pathValid = (path, routers) => {
  const temp = path.startsWith('/') ? path.substr(1) : path
  const locations = temp.split('/')
  if (locations.length === 0) {
    return false
  }

  return hasCurrentRouter(locations, routers, 0)
}
/**
 * 递归验证every level
 * @param {*} locations
 * @param {*} routers
 * @param {*} index
 * @returns
 */
const hasCurrentRouter = (locations, routers, index) => {
  const location = locations[index]
  let kids = []
  const isvalid = routers.some(router => {
    kids = router.children
    return (router.path === location || ('/' + location) === router.path)
  })
  if (isvalid && index < locations.length - 1) {
    return hasCurrentRouter(locations, kids, index + 1)
  }
  return isvalid
}
// 根据权限过滤菜单
const filterRouter = routers => {
  const user_permissions = store.getters.permissions
  // if (!user_permissions || user_permissions.length === 0) {
  //   return routers
  // }
  const tempResults = routers.filter(router => hasPermission(router, user_permissions))
  // 如果是一级菜单(目录) 没有字菜单 那就移除
  return tempResults.filter(item => {
    if (item.type === 0 && (!item.children || item.children.length === 0)) {
      return false
    }
    return true
  })
}
const hasPermission = (router, user_permissions) => {
  // 菜单要求权限 但是当前用户权限没有包含菜单权限
  if (router.permission && !user_permissions.includes(router.permission)) {
    return false
  }
  if (!filterLic(router)) {
    return false
  }
  // 如果有字菜单 则 判断是否满足 ‘任意一个子菜单有权限’
  if (router.children && router.children.length) {
    const permissionChilds = router.children.filter(item => hasPermission(item, user_permissions))
    router.children = permissionChilds
    return router.children.length > 0
  }
  return true
}
const filterLic = (router) => {
  return !router.isPlugin || store.getters.validate
}
router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})
//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwidXNlcklkIjoxfQ.WMm1Rt_9WSuOiABJF6HK9e3XePsPkxpGx-axefb6AMU
