/**
 * 机型 / 镜头 / 地点 预设。
 *
 * Make、Model 用的是厂商写进 EXIF 的**原始值**，不是市售名称。
 * 苹果比较特殊，它的 Model 就是市售名（"iPhone 17 Pro Max"）；
 * 安卓厂商写的是内部型号代码（如三星 SM-S9480、小米 2211133C），
 * 填市售名在看图软件里会对不上。
 *
 * ⚠️ 加新机型前务必核对 Model 的真实值。
 * 拿不准就别加：一个编造的型号代码写进 EXIF，任何人一查就知道是假的，
 * 比停留在旧机型更糟。最可靠的来源是那台手机拍的照片本身，
 * 或者 设置 → 关于本机 里显示的型号。
 *
 * 当前状态（2026-08）：
 *   Apple    已更新到 iPhone 17 系列，Model 即市售名，可确认
 *   三星     S26 Ultra = SM-S948 系列（国行尾号 0），已查证
 *   华为/小米/vivo/OPPO
 *            仍是 2023-2024 机型。这几家 2025 年后新机的内部型号代码
 *            没能查到可靠来源，没有编造，等拿到真实值再补。
 */

/**
 * 镜头参数。
 *
 * focalLength 是物理焦距（mm），focal35 是等效 35mm 焦距，
 * 两者都写：相册显示物理焦距，而很多看图软件显示等效焦距，
 * 只写一个会出现两处对不上。
 */
const APPLE_LENSES = (name, ver) => [
	{
		key: 'main', label: '主摄',
		model: `${name} back camera ${ver.mainF}mm f/${ver.mainA}`,
		focalLength: ver.mainF, fNumber: ver.mainA, focal35: 24
	},
	{
		key: 'ultra', label: '超广角',
		model: `${name} back camera ${ver.ultraF}mm f/${ver.ultraA}`,
		focalLength: ver.ultraF, fNumber: ver.ultraA, focal35: 13
	},
	{
		key: 'front', label: '前置',
		model: `${name} front camera ${ver.frontF}mm f/${ver.frontA}`,
		focalLength: ver.frontF, fNumber: ver.frontA, focal35: 23
	}
]

const ANDROID_LENSES = (main, ultra, front) => [
	{ key: 'main', label: '主摄', model: main.m, focalLength: main.f, fNumber: main.a, focal35: 24 },
	{ key: 'ultra', label: '超广角', model: ultra.m, focalLength: ultra.f, fNumber: ultra.a, focal35: 15 },
	{ key: 'front', label: '前置', model: front.m, focalLength: front.f, fNumber: front.a, focal35: 26 }
]

export const DEVICE_PRESETS = [
	{
		brand: 'Apple',
		items: [
			{
				label: 'iPhone 17 Pro Max', make: 'Apple', model: 'iPhone 17 Pro Max', software: '26.0',
				lenses: APPLE_LENSES('iPhone 17 Pro Max', { mainF: 6.765, mainA: 1.78, ultraF: 2.22, ultraA: 2.2, frontF: 2.69, frontA: 1.9 })
			},
			{
				label: 'iPhone 17 Pro', make: 'Apple', model: 'iPhone 17 Pro', software: '26.0',
				lenses: APPLE_LENSES('iPhone 17 Pro', { mainF: 6.765, mainA: 1.78, ultraF: 2.22, ultraA: 2.2, frontF: 2.69, frontA: 1.9 })
			},
			{
				label: 'iPhone 17', make: 'Apple', model: 'iPhone 17', software: '26.0',
				lenses: APPLE_LENSES('iPhone 17', { mainF: 5.96, mainA: 1.6, ultraF: 1.54, ultraA: 2.2, frontF: 2.69, frontA: 1.9 })
			},
			{
				label: 'iPhone Air', make: 'Apple', model: 'iPhone Air', software: '26.0',
				lenses: APPLE_LENSES('iPhone Air', { mainF: 6.765, mainA: 1.6, ultraF: 6.765, ultraA: 1.6, frontF: 2.69, frontA: 1.9 })
			},
			{
				label: 'iPhone 16 Pro Max', make: 'Apple', model: 'iPhone 16 Pro Max', software: '18.5',
				lenses: APPLE_LENSES('iPhone 16 Pro Max', { mainF: 6.765, mainA: 1.78, ultraF: 2.22, ultraA: 2.2, frontF: 2.69, frontA: 1.9 })
			},
			{
				label: 'iPhone 16 Pro', make: 'Apple', model: 'iPhone 16 Pro', software: '18.5',
				lenses: APPLE_LENSES('iPhone 16 Pro', { mainF: 6.765, mainA: 1.78, ultraF: 2.22, ultraA: 2.2, frontF: 2.69, frontA: 1.9 })
			},
			{
				label: 'iPhone 15 Pro Max', make: 'Apple', model: 'iPhone 15 Pro Max', software: '17.5.1',
				lenses: APPLE_LENSES('iPhone 15 Pro Max', { mainF: 6.86, mainA: 1.78, ultraF: 2.22, ultraA: 2.2, frontF: 2.69, frontA: 1.9 })
			},
			{
				label: 'iPhone 15 Pro', make: 'Apple', model: 'iPhone 15 Pro', software: '17.5.1',
				lenses: APPLE_LENSES('iPhone 15 Pro', { mainF: 6.86, mainA: 1.78, ultraF: 2.22, ultraA: 2.2, frontF: 2.69, frontA: 1.9 })
			}
		]
	},
	{
		brand: '华为',
		items: [
			{
				label: 'Mate 60 Pro', make: 'HUAWEI', model: 'ALN-AL00', software: 'HarmonyOS 4.0',
				lenses: ANDROID_LENSES(
					{ m: 'ALN-AL00 back main camera 6.72mm f/1.4', f: 6.72, a: 1.4 },
					{ m: 'ALN-AL00 back wide camera 2.2mm f/2.2', f: 2.2, a: 2.2 },
					{ m: 'ALN-AL00 front camera 2.6mm f/2.4', f: 2.6, a: 2.4 })
			},
			{
				label: 'P60 Pro', make: 'HUAWEI', model: 'MNA-AL00', software: 'HarmonyOS 3.1',
				lenses: ANDROID_LENSES(
					{ m: 'MNA-AL00 back main camera 6.8mm f/1.4', f: 6.8, a: 1.4 },
					{ m: 'MNA-AL00 back wide camera 2.2mm f/2.2', f: 2.2, a: 2.2 },
					{ m: 'MNA-AL00 front camera 2.6mm f/2.4', f: 2.6, a: 2.4 })
			}
		]
	},
	{
		brand: '小米',
		items: [
			{
				label: '小米 14 Pro', make: 'Xiaomi', model: '23116PN5BC', software: 'HyperOS',
				lenses: ANDROID_LENSES(
					{ m: 'xiaomi 23116PN5BC back main camera 8.7mm f/1.42', f: 8.7, a: 1.42 },
					{ m: 'xiaomi 23116PN5BC back wide camera 2.3mm f/2.2', f: 2.3, a: 2.2 },
					{ m: 'xiaomi 23116PN5BC front camera 3.0mm f/2.0', f: 3.0, a: 2.0 })
			},
			{
				label: '小米 13', make: 'Xiaomi', model: '2211133C', software: 'MIUI 14',
				lenses: ANDROID_LENSES(
					{ m: 'xiaomi 2211133C back main camera 6.6mm f/1.8', f: 6.6, a: 1.8 },
					{ m: 'xiaomi 2211133C back wide camera 2.2mm f/2.2', f: 2.2, a: 2.2 },
					{ m: 'xiaomi 2211133C front camera 2.9mm f/2.0', f: 2.9, a: 2.0 })
			}
		]
	},
	{
		brand: '其它',
		items: [
			{
				label: 'vivo X100 Pro', make: 'vivo', model: 'V2309A', software: 'OriginOS 4',
				lenses: ANDROID_LENSES(
					{ m: 'V2309A back main camera 8.7mm f/1.75', f: 8.7, a: 1.75 },
					{ m: 'V2309A back wide camera 2.3mm f/2.0', f: 2.3, a: 2.0 },
					{ m: 'V2309A front camera 3.0mm f/2.0', f: 3.0, a: 2.0 })
			},
			{
				label: 'OPPO Find X7', make: 'OPPO', model: 'PHY110', software: 'ColorOS 14',
				lenses: ANDROID_LENSES(
					{ m: 'PHY110 back main camera 7.0mm f/1.7', f: 7.0, a: 1.7 },
					{ m: 'PHY110 back wide camera 2.2mm f/2.0', f: 2.2, a: 2.0 },
					{ m: 'PHY110 front camera 3.0mm f/2.4', f: 3.0, a: 2.4 })
			},
			{
				// 国行型号尾号为 0（SM-S9480），海外为 B/U 等，EXIF 里写的是各自的完整型号
				label: '三星 S26 Ultra', make: 'samsung', model: 'SM-S9480', software: 'One UI 8.5',
				lenses: ANDROID_LENSES(
					{ m: 'SM-S9480 back main camera 6.3mm f/1.7', f: 6.3, a: 1.7 },
					{ m: 'SM-S9480 back wide camera 2.2mm f/2.2', f: 2.2, a: 2.2 },
					{ m: 'SM-S9480 front camera 3.0mm f/2.2', f: 3.0, a: 2.2 })
			},
			{
				label: '三星 S24 Ultra', make: 'samsung', model: 'SM-S9280', software: 'One UI 6.1',
				lenses: ANDROID_LENSES(
					{ m: 'SM-S9280 back main camera 6.3mm f/1.7', f: 6.3, a: 1.7 },
					{ m: 'SM-S9280 back wide camera 2.2mm f/2.2', f: 2.2, a: 2.2 },
					{ m: 'SM-S9280 front camera 3.0mm f/2.2', f: 3.0, a: 2.2 })
			}
		]
	}
]

/**
 * 地点坐标（WGS-84，十进制度）。
 *
 * 用的是 GPS 原始坐标系 WGS-84，不是国内地图的 GCJ-02 火星坐标——
 * EXIF 里存的本来就是 GPS 芯片输出的 WGS-84，
 * 填火星坐标的话在国外软件（如 iOS 相册、Google Photos）里会偏移几百米。
 */
/**
 * 地点坐标（WGS-84，十进制度）。
 *
 * 用 GPS 原始坐标系 WGS-84，不是国内地图的 GCJ-02 火星坐标——
 * EXIF 里存的本来就是 GPS 芯片输出的 WGS-84，
 * 填火星坐标的话在国外软件（iOS 相册、Google Photos）里会偏移几百米。
 *
 * 纬度北正南负，经度东正西负。南半球和西半球的条目务必是负数，
 * 写成正数会把照片定位到地球另一边。
 */
export const LOCATION_PRESETS = [
	{
		region: '中国大陆',
		items: [
			{ label: '上海·外滩', lat: 31.2397, lng: 121.4909 },
			{ label: '上海·东方明珠', lat: 31.2397, lng: 121.4998 },
			{ label: '北京·天安门', lat: 39.9087, lng: 116.3975 },
			{ label: '北京·故宫', lat: 39.9163, lng: 116.3972 },
			{ label: '北京·八达岭长城', lat: 40.3587, lng: 116.0169 },
			{ label: '广州·小蛮腰', lat: 23.1066, lng: 113.3245 },
			{ label: '深圳·世界之窗', lat: 22.5361, lng: 113.9739 },
			{ label: '杭州·西湖', lat: 30.2489, lng: 120.1416 },
			{ label: '苏州·拙政园', lat: 31.3243, lng: 120.6293 },
			{ label: '南京·夫子庙', lat: 32.0223, lng: 118.7889 },
			{ label: '重庆·洪崖洞', lat: 29.5647, lng: 106.5828 },
			{ label: '成都·宽窄巷子', lat: 30.6693, lng: 104.0576 },
			{ label: '成都·大熊猫基地', lat: 30.7378, lng: 104.1466 },
			{ label: '西安·大雁塔', lat: 34.2186, lng: 108.9640 },
			{ label: '西安·兵马俑', lat: 34.3853, lng: 109.2734 },
			{ label: '厦门·鼓浪屿', lat: 24.4476, lng: 118.0673 },
			{ label: '青岛·栈桥', lat: 36.0570, lng: 120.3120 },
			{ label: '桂林·漓江', lat: 25.2736, lng: 110.2900 },
			{ label: '张家界', lat: 29.3251, lng: 110.4344 },
			{ label: '丽江古城', lat: 26.8721, lng: 100.2350 },
			{ label: '三亚·亚龙湾', lat: 18.2178, lng: 109.6379 },
			{ label: '拉萨·布达拉宫', lat: 29.6558, lng: 91.1175 }
		]
	},
	{
		region: '港澳台',
		items: [
			{ label: '香港·维多利亚港', lat: 22.2940, lng: 114.1722 },
			{ label: '香港·尖沙咀', lat: 22.2933, lng: 114.1735 },
			{ label: '香港·太平山顶', lat: 22.2759, lng: 114.1455 },
			{ label: '香港·迪士尼乐园', lat: 22.3130, lng: 114.0413 },
			{ label: '澳门·大三巴', lat: 22.1975, lng: 113.5407 },
			{ label: '澳门·威尼斯人', lat: 22.1462, lng: 113.5599 },
			{ label: '台北·101', lat: 25.0339, lng: 121.5645 },
			{ label: '台北·西门町', lat: 25.0421, lng: 121.5075 },
			{ label: '日月潭', lat: 23.8500, lng: 120.9150 },
			{ label: '高雄·爱河', lat: 22.6273, lng: 120.2870 }
		]
	},
	{
		region: '日本',
		items: [
			{ label: '东京·涩谷', lat: 35.6595, lng: 139.7005 },
			{ label: '东京·东京塔', lat: 35.6586, lng: 139.7454 },
			{ label: '东京·浅草寺', lat: 35.7148, lng: 139.7967 },
			{ label: '东京·台场', lat: 35.6297, lng: 139.7756 },
			{ label: '东京·迪士尼', lat: 35.6329, lng: 139.8804 },
			{ label: '富士山', lat: 35.3606, lng: 138.7274 },
			{ label: '大阪·道顿堀', lat: 34.6687, lng: 135.5013 },
			{ label: '大阪·环球影城', lat: 34.6654, lng: 135.4323 },
			{ label: '京都·清水寺', lat: 34.9949, lng: 135.7850 },
			{ label: '京都·伏见稻荷', lat: 34.9671, lng: 135.7727 },
			{ label: '奈良公园', lat: 34.6851, lng: 135.8430 },
			{ label: '北海道·札幌', lat: 43.0618, lng: 141.3545 },
			{ label: '冲绳·那霸', lat: 26.2124, lng: 127.6809 }
		]
	},
	{
		region: '韩国',
		items: [
			{ label: '首尔·明洞', lat: 37.5636, lng: 126.9826 },
			{ label: '首尔·景福宫', lat: 37.5796, lng: 126.9770 },
			{ label: '首尔·N首尔塔', lat: 37.5512, lng: 126.9882 },
			{ label: '首尔·江南', lat: 37.4979, lng: 127.0276 },
			{ label: '釜山·海云台', lat: 35.1587, lng: 129.1604 },
			{ label: '济州岛', lat: 33.4996, lng: 126.5312 }
		]
	},
	{
		region: '东南亚',
		items: [
			{ label: '泰国·曼谷大皇宫', lat: 13.7500, lng: 100.4914 },
			{ label: '泰国·普吉岛', lat: 7.8804, lng: 98.3923 },
			{ label: '泰国·清迈', lat: 18.7883, lng: 98.9853 },
			{ label: '新加坡·滨海湾金沙', lat: 1.2834, lng: 103.8607 },
			{ label: '新加坡·环球影城', lat: 1.2540, lng: 103.8238 },
			{ label: '马来西亚·双子塔', lat: 3.1578, lng: 101.7117 },
			{ label: '越南·河内还剑湖', lat: 21.0287, lng: 105.8524 },
			{ label: '越南·岘港', lat: 16.0544, lng: 108.2022 },
			{ label: '印尼·巴厘岛', lat: -8.4095, lng: 115.1889 },
			{ label: '菲律宾·长滩岛', lat: 11.9674, lng: 121.9248 }
		]
	},
	{
		region: '美国',
		items: [
			{ label: '纽约·时代广场', lat: 40.7580, lng: -73.9855 },
			{ label: '纽约·自由女神', lat: 40.6892, lng: -74.0445 },
			{ label: '纽约·中央公园', lat: 40.7829, lng: -73.9654 },
			{ label: '旧金山·金门大桥', lat: 37.8199, lng: -122.4783 },
			{ label: '洛杉矶·好莱坞', lat: 34.1022, lng: -118.3406 },
			{ label: '洛杉矶·环球影城', lat: 34.1381, lng: -118.3534 },
			{ label: '拉斯维加斯', lat: 36.1147, lng: -115.1728 },
			{ label: '西雅图·太空针塔', lat: 47.6205, lng: -122.3493 },
			{ label: '大峡谷', lat: 36.0544, lng: -112.1401 },
			{ label: '奥兰多·迪士尼', lat: 28.3852, lng: -81.5639 },
			{ label: '夏威夷·威基基', lat: 21.2793, lng: -157.8292 }
		]
	},
	{
		region: '欧洲',
		items: [
			{ label: '法国·埃菲尔铁塔', lat: 48.8584, lng: 2.2945 },
			{ label: '法国·卢浮宫', lat: 48.8606, lng: 2.3376 },
			{ label: '英国·伦敦塔桥', lat: 51.5055, lng: -0.0754 },
			{ label: '英国·大本钟', lat: 51.5007, lng: -0.1246 },
			{ label: '意大利·罗马斗兽场', lat: 41.8902, lng: 12.4922 },
			{ label: '意大利·威尼斯', lat: 45.4340, lng: 12.3388 },
			{ label: '意大利·比萨斜塔', lat: 43.7230, lng: 10.3966 },
			{ label: '西班牙·圣家堂', lat: 41.4036, lng: 2.1744 },
			{ label: '德国·新天鹅堡', lat: 47.5576, lng: 10.7498 },
			{ label: '荷兰·阿姆斯特丹', lat: 52.3676, lng: 4.9041 },
			{ label: '瑞士·少女峰', lat: 46.5474, lng: 7.9822 },
			{ label: '捷克·布拉格', lat: 50.0755, lng: 14.4378 },
			{ label: '希腊·圣托里尼', lat: 36.3932, lng: 25.4615 },
			{ label: '冰岛·雷克雅未克', lat: 64.1466, lng: -21.9426 }
		]
	},
	{
		region: '大洋洲',
		items: [
			{ label: '澳洲·悉尼歌剧院', lat: -33.8568, lng: 151.2153 },
			{ label: '澳洲·大堡礁', lat: -16.2864, lng: 145.7781 },
			{ label: '澳洲·墨尔本', lat: -37.8136, lng: 144.9631 },
			{ label: '澳洲·黄金海岸', lat: -28.0167, lng: 153.4000 },
			{ label: '新西兰·皇后镇', lat: -45.0312, lng: 168.6626 },
			{ label: '新西兰·奥克兰', lat: -36.8485, lng: 174.7633 }
		]
	},
	{
		region: '中东非洲',
		items: [
			{ label: '迪拜·哈利法塔', lat: 25.1972, lng: 55.2744 },
			{ label: '迪拜·棕榈岛', lat: 25.1124, lng: 55.1390 },
			{ label: '土耳其·伊斯坦布尔', lat: 41.0082, lng: 28.9784 },
			{ label: '土耳其·卡帕多奇亚', lat: 38.6431, lng: 34.8289 },
			{ label: '埃及·金字塔', lat: 29.9792, lng: 31.1342 },
			{ label: '摩洛哥·马拉喀什', lat: 31.6295, lng: -7.9811 },
			{ label: '南非·开普敦', lat: -33.9249, lng: 18.4241 }
		]
	},
	{
		region: '美洲其它',
		items: [
			{ label: '加拿大·尼亚加拉瀑布', lat: 43.0962, lng: -79.0377 },
			{ label: '加拿大·温哥华', lat: 49.2827, lng: -123.1207 },
			{ label: '加拿大·班夫', lat: 51.1784, lng: -115.5708 },
			{ label: '巴西·耶稣像', lat: -22.9519, lng: -43.2105 },
			{ label: '秘鲁·马丘比丘', lat: -13.1631, lng: -72.5450 },
			{ label: '阿根廷·布宜诺斯艾利斯', lat: -34.6037, lng: -58.3816 },
			{ label: '墨西哥·坎昆', lat: 21.1619, lng: -86.8515 }
		]
	}
]
