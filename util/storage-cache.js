/**
 * 本地缓存小工具（SWR：stale-while-revalidate 用）。
 *
 * 配置类数据（图片类型、分类、首页推荐图）冷启动时先读本地立即渲染，
 * 再后台请求线上刷新并回写，避免每次打开都白屏等网络。
 *
 * key 约定带版本号（如 'imageTypes:v1'）：数据结构变更时升版本，
 * 旧缓存 key 自然失效，不用写迁移逻辑。
 */

/** 读缓存；不存在或异常都返回 null（uni 在 key 不存在时返回空串） */
export function readCache(key) {
	try {
		const v = uni.getStorageSync(key)
		if (v === '' || v === undefined || v === null) return null
		return v
	} catch (e) {
		console.warn('[cache] 读取失败:', key, e)
		return null
	}
}

/** 写缓存；失败只告警不抛（缓存是锦上添花，不该影响主流程） */
export function writeCache(key, data) {
	try {
		uni.setStorageSync(key, data)
	} catch (e) {
		console.warn('[cache] 写入失败:', key, e)
	}
}

/** 删缓存 */
export function removeCache(key) {
	try {
		uni.removeStorageSync(key)
	} catch (e) {
		// 删不掉无所谓
	}
}
