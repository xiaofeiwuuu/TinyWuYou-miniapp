/**
 * 机型 / 镜头 / 地点 预设。
 *
 * Make、Model 用的是厂商写进 EXIF 的**原始值**，不是市售名称——
 * 相册和看图软件读的就是这些原始值，填市售名（如「iPhone 15 Pro Max」
 * 对某些安卓机而言）在部分软件里会对不上或显示不出来。
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
			},
			{
				label: 'iPhone 15', make: 'Apple', model: 'iPhone 15', software: '17.5.1',
				lenses: APPLE_LENSES('iPhone 15', { mainF: 5.96, mainA: 1.6, ultraF: 1.54, ultraA: 2.4, frontF: 2.69, frontA: 1.9 })
			},
			{
				label: 'iPhone 14 Pro Max', make: 'Apple', model: 'iPhone 14 Pro Max', software: '16.6',
				lenses: APPLE_LENSES('iPhone 14 Pro Max', { mainF: 6.86, mainA: 1.78, ultraF: 2.22, ultraA: 2.2, frontF: 2.69, frontA: 1.9 })
			},
			{
				label: 'iPhone 13', make: 'Apple', model: 'iPhone 13', software: '15.6',
				lenses: APPLE_LENSES('iPhone 13', { mainF: 5.7, mainA: 1.6, ultraF: 1.57, ultraA: 2.4, frontF: 2.71, frontA: 2.2 })
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
export const LOCATION_PRESETS = [
	{
		region: '中国',
		items: [
			{ label: '上海·外滩', lat: 31.2397, lng: 121.4909 },
			{ label: '北京·天安门', lat: 39.9087, lng: 116.3975 },
			{ label: '杭州·西湖', lat: 30.2489, lng: 120.1416 },
			{ label: '重庆·洪崖洞', lat: 29.5647, lng: 106.5828 },
			{ label: '成都·宽窄巷子', lat: 30.6693, lng: 104.0576 },
			{ label: '西安·大雁塔', lat: 34.2186, lng: 108.9640 },
			{ label: '三亚·亚龙湾', lat: 18.2178, lng: 109.6379 }
		]
	},
	{
		region: '香港',
		items: [
			{ label: '维多利亚港', lat: 22.2940, lng: 114.1722 },
			{ label: '尖沙咀星光大道', lat: 22.2933, lng: 114.1735 },
			{ label: '太平山顶', lat: 22.2759, lng: 114.1455 },
			{ label: '迪士尼乐园', lat: 22.3130, lng: 114.0413 }
		]
	},
	{
		region: '日本',
		items: [
			{ label: '东京·涩谷', lat: 35.6595, lng: 139.7005 },
			{ label: '东京·浅草寺', lat: 35.7148, lng: 139.7967 },
			{ label: '富士山', lat: 35.3606, lng: 138.7274 },
			{ label: '大阪·道顿堀', lat: 34.6687, lng: 135.5013 },
			{ label: '京都·清水寺', lat: 34.9949, lng: 135.7850 }
		]
	},
	{
		region: '美国',
		items: [
			{ label: '纽约·时代广场', lat: 40.7580, lng: -73.9855 },
			{ label: '旧金山·金门大桥', lat: 37.8199, lng: -122.4783 },
			{ label: '洛杉矶·好莱坞', lat: 34.1022, lng: -118.3406 },
			{ label: '拉斯维加斯', lat: 36.1147, lng: -115.1728 },
			{ label: '夏威夷·威基基', lat: 21.2793, lng: -157.8292 }
		]
	}
]
