// Toast提示工具导出



// Toast实例引用
let toastInstance: any = null

// 注册Toast组件实例
export const registerToast = (instance: any) => {
  toastInstance = instance
}

// Toast提示方法
export const toast = {
  success: (message: string, duration?: number) => {
    toastInstance?.toast.success(message, duration)
  },

  error: (message: string, duration?: number) => {
    toastInstance?.toast.error(message, duration)
  },

  warning: (message: string, duration?: number) => {
    toastInstance?.toast.warning(message, duration)
  },

  info: (message: string, duration?: number) => {
    toastInstance?.toast.info(message, duration)
  },

  remove: (id: number) => {
    toastInstance?.toast.remove(id)
  }
}
