/**
 * 常见机型的 EXIF 标识预设。
 *
 * Make / Model 用的是各厂商真机写进 EXIF 的原始值，不是市售名称——
 * 相册和看图软件读的是这些原始值，写"iPhone 15 Pro Max"这种市售名
 * 在部分软件里会显示不出来或对不上。
 *
 * software 是系统/相机版本，留空则不写这个标签。
 */
export const DEVICE_PRESETS = [
	{
		brand: 'Apple',
		items: [
			{ label: 'iPhone 16 Pro Max', make: 'Apple', model: 'iPhone 16 Pro Max', software: '18.5' },
			{ label: 'iPhone 16 Pro', make: 'Apple', model: 'iPhone 16 Pro', software: '18.5' },
			{ label: 'iPhone 15 Pro Max', make: 'Apple', model: 'iPhone 15 Pro Max', software: '17.5.1' },
			{ label: 'iPhone 15 Pro', make: 'Apple', model: 'iPhone 15 Pro', software: '17.5.1' },
			{ label: 'iPhone 15', make: 'Apple', model: 'iPhone 15', software: '17.5.1' },
			{ label: 'iPhone 14 Pro Max', make: 'Apple', model: 'iPhone 14 Pro Max', software: '16.6' },
			{ label: 'iPhone 13', make: 'Apple', model: 'iPhone 13', software: '15.6' }
		]
	},
	{
		brand: '华为',
		items: [
			{ label: 'Mate 60 Pro', make: 'HUAWEI', model: 'ALN-AL00', software: 'HarmonyOS 4.0' },
			{ label: 'P60 Pro', make: 'HUAWEI', model: 'MNA-AL00', software: 'HarmonyOS 3.1' }
		]
	},
	{
		brand: '小米',
		items: [
			{ label: '小米 14 Pro', make: 'Xiaomi', model: '23116PN5BC', software: 'HyperOS' },
			{ label: '小米 13', make: 'Xiaomi', model: '2211133C', software: 'MIUI 14' }
		]
	},
	{
		brand: '其它',
		items: [
			{ label: 'vivo X100 Pro', make: 'vivo', model: 'V2309A', software: 'OriginOS 4' },
			{ label: 'OPPO Find X7', make: 'OPPO', model: 'PHY110', software: 'ColorOS 14' },
			{ label: '三星 S24 Ultra', make: 'samsung', model: 'SM-S9280', software: 'One UI 6.1' }
		]
	}
]

/** 拍平成一维，供选择器直接用 */
export const FLAT_PRESETS = DEVICE_PRESETS.flatMap((g) =>
	g.items.map((it) => ({ ...it, brand: g.brand }))
)
