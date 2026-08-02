export default {
    props: {
        // 图片地址
        src: {
            type: String,
            default: ''
        },
        // 裁剪模式（默认 'aspectFill'）
        mode: {
            type: String,
            default: 'aspectFill'
        },
        // 宽度，单位任意
        width: {
            type: [String,Number],
            default: 150
        },
        // 高度，单位任意
        height: {
            type: [String,Number],
            default: 150
        },
        // 图片形状，circle-圆形，square-方形
        shape: {
            type: String,
            default: 'square'
        },
        // 圆角，单位任意
        radius: {
            type: [String,Number],
            default: 0
        },
        // 是否懒加载，微信小程序、App、百度小程序、字节跳动小程序
        lazyLoad: {
            type: Boolean,
            default: true
        },
		// 是否开启observer懒加载，nvue不生效
		observeLazyLoad: {
			type: Boolean,
			default: false
		},
        // 开启长按图片显示识别微信小程序码菜单（默认关闭，防止用户直接保存图片）
        showMenuByLongpress: {
            type: Boolean,
            default: false
        },
        // 加载中的图标（uview-plus 图标名）
        loadingIcon: {
            type: String,
            default: 'photo'
        },
        // 加载失败的图标（uview-plus 图标名）
        errorIcon: {
            type: String,
            default: 'error-circle'
        },
        // 是否显示加载中的图标或者自定义的slot
        showLoading: {
            type: Boolean,
            default: true
        },
        // 是否显示加载错误的图标或者自定义的slot
        showError: {
            type: Boolean,
            default: true
        },
        // 是否需要淡入效果
        fade: {
            type: Boolean,
            default: true
        },
        // 只支持网络资源，只对微信小程序有效
        webp: {
            type: Boolean,
            default: true
        },
        // 过渡时间，单位ms
        duration: {
            type: [String,Number],
            default: 300
        },
        // 背景颜色，用于深色页面加载图片时，为了和背景色融合
        bgColor: {
            type: String,
            default: ''
        },
		// 图片模糊 默认0
		dim: {
			type: [String,Number],
			default: 0
		},
		// 外部自定义样式
		customStyle: {
			type: [Object, String],
			default: () => ({})
		},
		// 加载失败时显示的占位图。不配则退回 errorIcon 图标占位。
		// 注意占位图要放本地 static 目录，别再指向图床——
		// 图床挂掉正是需要占位图的场景，占位图自己也挂就没意义了
		errorSrc: {
			type: String,
			default: ''
		}
    }
}
