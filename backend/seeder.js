const mongoose = require('mongoose');
const dotenv = require('dotenv');

// CHANGE THESE PATHS IF YOUR MODELS ARE SOMEWHERE ELSE
const Product = require('./src/models/productModel'); 
const Category = require('./src/models/categoryModel');

dotenv.config();

const categoriesData = [
  { name: 'Smartphones & Accessories', description: 'Latest mobile phones, cases, and fast chargers.' },
  { name: 'Laptops & Computers', description: 'High-performance laptops, desktops, and monitors.' },
  { name: 'Audio & Headphones', description: 'Premium wireless headphones, earbuds, and Bluetooth speakers.' },
  { name: 'Smart Home & Wearables', description: 'Smartwatches, fitness trackers, and smart home automation devices.' },
  { name: 'Gaming & Consoles', description: 'Video game consoles, VR headsets, and gaming accessories.' }
];

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

// ==========================================
// THE MANUAL CLOUDINARY MAP
// You MUST paste the exact Cloudinary URL for every product here.
// ==========================================
const PRODUCT_IMAGE_LINKS = {
  'iPhone 15 Pro Max': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772097900/Apple_iPhone_15_Pro_Max_eifuv1.jpg',
  'Samsung Galaxy S24 Ultra': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098125/Samsung_Galaxy_S24_zk99tn.jpg',
  'Google Pixel 8 Pro': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098077/Google_Pixel_8_Pro_rluezg.png',
  'OnePlus 12': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098092/OnePlus_12_tgbyml.png',
  'iPhone 13 Mini': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098078/iphone13mini_wiyrho.jpg',
  'Samsung Galaxy Z Fold 5': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098124/Samsung_Galaxy_Z_Fold_5_hdg3qz.jpg',
  'Anker 100W GaN Fast Charger': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772097900/Anker_100W_GaN_Fast_Charger_dmwss4.jpg',
  'Apple MagSafe Wireless Puck': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772097909/Apple_MagSafe_Wireless_Puck_ytfpkv.png',
  'OtterBox Defender Case': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098090/OtterBox_Defender_Case_ulb3y2.jpg',
  'Belkin USB-C Hub 7-in-1': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098059/Belkin_USB-C_Hub_7-in-1_woouvx.jpg',
  'Baseus 20000mAh Power Bank': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098058/Baseus_20000mAh_Power_Bank_ertfpo.jpg',
  
  'MacBook Pro 16-inch (M3 Max)': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098073/MacBook_Pro_16-inch_M3_Max_l6qa6i.jpg',
  'Dell XPS 15 OLED': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098063/Dell_XPS_15_OLED_uzdgk8.jpg',
  'Lenovo ThinkPad X1 Carbon': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098097/Lenovo_ThinkPad_X1_Carbon_t4s58f.png',
  'ASUS ROG Zephyrus G14': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098057/ASUS_ROG_Zephyrus_G14_mogkko.jpg',
  'LG UltraWide 34-inch Monitor': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098080/LG_UltraWide_34-inch_Monitor_fjxr4x.png',
  'Logitech MX Master 3S': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098096/Logitech_MX_Master_3S_u2jwwi.jpg',
  'Keychron K2 Mechanical Keyboard': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098087/Keychron_K2_Mechanical_Keyboard_hvjbzb.jpg',
  'Samsung Odyssey G7 27-inch': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098130/Samsung_Odyssey_G7_27-inch_h6bnp3.jpg',
  'Razer Blade 16 Gaming Laptop': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098107/Razer_Blade_16_Gaming_Laptop_afdgdm.webp',
  'WD Black 2TB NVMe SSD': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098132/WD_Black_2TB_NVMe_SSD_rayyax.jpg',
  'Elgato Thunderbolt 4 Dock': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098068/Elgato_Thunderbolt_4_Dock_an9tcz.jpg',
  
  'Sony WH-1000XM5': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098127/Sony_WH-1000XM5_hzqs3h.jpg',
  'Apple AirPods Pro (2nd Gen)': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772097898/Apple_AirPods_Pro_2nd_Gen_ciqryu.jpg',
  'Sennheiser Momentum 4': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098126/Sennheiser_Momentum_4_edbubq.jpg',
  'Beats Studio Pro': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098058/Beats_Studio_Pro_rtplq5.jpg',
  'Audio-Technica ATH-M50x': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098058/Audio-Technica_ATH-M50x_prcruf.jpg',
  'Samsung Galaxy Buds 2 Pro': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098121/Samsung_Galaxy_Buds_2_Pro_utotcx.jpg',
  'Jabra Evolve2 85': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098077/Jabra_Evolve2_85_iwnidu.jpg',
  'Bowers & Wilkins Px8': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098059/Bowers_Wilkins_Px8_rfkkxp.jpg',
  'Sony LinkBuds S': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098126/Sony_LinkBuds_S_fwz5a1.jpg',
  
  'Apple Watch Ultra 2': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772097896/Apple_Watch_Ultra_2_steaqb.jpg',
  'Samsung Galaxy Watch 6 Classic': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098123/Samsung_Galaxy_Watch_6_Classic_xrrzlf.jpg',
  'Garmin Fenix 7 Pro': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098068/Garmin_Fenix_7_Pro_iabwah.jpg',
  'Oura Ring Gen 3': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098090/Oura_Ring_Gen_3_qoclyf.jpg',
  'Google Nest Hub Max': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098087/Google_Nest_Hub_Max_izpkoa.jpg',
  'Ring Video Doorbell Pro 2': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098116/Ring_Video_Doorbell_Pro_2_oqnl6t.png',
  'Ecobee Smart Thermostat Premium': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098064/Ecobee_Smart_Thermostat_Premium_pim73b.jpg',
  'Fitbit Charge 6': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098066/Fitbit_Charge_6_ir70iu.jpg',
  'Arlo Pro 5 Security Camera': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772097903/Arlo_Pro_5_Security_Camera_pskg2q.jpg',
  'Withings Body+ Smart Scale': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098137/Withings_Body_Smart_Scale_mqlnxt.jpg',
  
  'PlayStation 5 Slim Console': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098106/PlayStation_5_Slim_Console_uzqtvx.jpg',
  'Xbox Series X': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098131/Xbox_Series_X_r3ctoh.jpg',
  'Nintendo Switch OLED': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098126/Nintendo_Switch_OLED_hrfwxr.jpg',
  'Valve Steam Deck OLED': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098128/Valve_Steam_Deck_OLED_hloi6z.jpg',
  'Meta Quest 3 VR Headset': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098082/Meta_Quest_3_VR_Headset_lewc9a.jpg',
  'DualSense Wireless Controller': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098063/DualSense_Wireless_Controller_mz3itx.jpg',
  'Xbox Elite Wireless Controller S2': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098136/Xbox_Elite_Wireless_Controller_S2_biv6hn.jpg',
  'Razer DeathAdder V3 Pro': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098113/Razer_DeathAdder_V3_Pro_hqhgoy.jpg',
  'Elgato Stream Deck MK.2': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098069/Elgato_Stream_Deck_MK.2_fnlpqn.jpg',
  'ASUS ROG Ally Gaming Handheld': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772097982/ASUS_ROG_Ally_Gaming_Handheld_inwppf.webp',
  'Corsair K100 RGB Keyboard': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098060/Corsair_K100_RGB_Keyboard_cqbwmm.jpg',
  'Secretlab TITAN Evo Chair': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098125/Secretlab_TITAN_Evo_Chair_unfhut.jpg'
};

// Fallback just in case you miss one
const getFallbackImage = (productName) => `https://placehold.co/600x600/0f172a/ffffff?text=${encodeURIComponent(productName)}`;

const img = (productName) => {
  const manualLink = PRODUCT_IMAGE_LINKS[productName];
  if (manualLink && manualLink.trim() !== '') {
    return [manualLink.trim()];
  }
  return [getFallbackImage(productName)];
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Database...');

    console.log('Nuking old garbage data...');
    await Product.deleteMany();
    await Category.deleteMany();

    console.log('Injecting Electrofied Categories...');
    const categoriesWithSlugs = categoriesData.map(cat => ({ ...cat, slug: slugify(cat.name) }));
    const createdCategories = await Category.insertMany(categoriesWithSlugs);
    
    const phoneId  = createdCategories[0]._id;
    const laptopId = createdCategories[1]._id;
    const audioId  = createdCategories[2]._id;
    const homeId   = createdCategories[3]._id;
    const gamingId = createdCategories[4]._id;

    console.log('Generating 53 Realistic Products...');
    const productsData = [
      { name: 'iPhone 15 Pro Max', description: 'Titanium design, A17 Pro chip, 48MP Main camera.', price: 1199, stock: 45, categoryId: phoneId, images: img('iPhone 15 Pro Max') },
      { name: 'Samsung Galaxy S24 Ultra', description: 'Galaxy AI, titanium frame, built-in S Pen.', price: 1299, stock: 30, categoryId: phoneId, images: img('Samsung Galaxy S24 Ultra') },
      { name: 'Google Pixel 8 Pro', description: 'Tensor G3, pro-level cameras, 7 years of updates.', price: 999, stock: 20, categoryId: phoneId, images: img('Google Pixel 8 Pro') },
      { name: 'OnePlus 12', description: 'Snapdragon 8 Gen 3, Hasselblad camera system.', price: 799, stock: 15, categoryId: phoneId, images: img('OnePlus 12') },
      { name: 'iPhone 13 Mini', description: 'Compact powerhouse with A15 Bionic chip.', price: 599, stock: 10, categoryId: phoneId, images: img('iPhone 13 Mini') },
      { name: 'Samsung Galaxy Z Fold 5', description: 'Massive 7.6-inch display, PC-like multitasking.', price: 1799, stock: 8, categoryId: phoneId, images: img('Samsung Galaxy Z Fold 5') },
      { name: 'Anker 100W GaN Fast Charger', description: 'Compact fast charger for phones and laptops.', price: 45, stock: 100, categoryId: phoneId, images: img('Anker 100W GaN Fast Charger') },
      { name: 'Apple MagSafe Wireless Puck', description: 'Fast wireless charging with magnetic alignment.', price: 39, stock: 80, categoryId: phoneId, images: img('Apple MagSafe Wireless Puck') },
      { name: 'OtterBox Defender Case', description: 'Rugged drop protection for flagship phones.', price: 55, stock: 60, categoryId: phoneId, images: img('OtterBox Defender Case') },
      { name: 'Belkin USB-C Hub 7-in-1', description: 'Expand your ports with 4K HDMI and power delivery.', price: 65, stock: 40, categoryId: phoneId, images: img('Belkin USB-C Hub 7-in-1') },
      { name: 'Baseus 20000mAh Power Bank', description: 'High-capacity portable charger with 65W fast output.', price: 59, stock: 55, categoryId: phoneId, images: img('Baseus 20000mAh Power Bank') },

      { name: 'MacBook Pro 16-inch (M3 Max)', description: 'Mind-blowing speed. The ultimate pro laptop.', price: 3499, stock: 12, categoryId: laptopId, images: img('MacBook Pro 16-inch (M3 Max)') },
      { name: 'Dell XPS 15 OLED', description: 'Stunning 3.5K OLED display, Intel Core i7, compact powerhouse.', price: 1899, stock: 18, categoryId: laptopId, images: img('Dell XPS 15 OLED') },
      { name: 'Lenovo ThinkPad X1 Carbon', description: 'Ultralight business laptop with legendary keyboard.', price: 1599, stock: 25, categoryId: laptopId, images: img('Lenovo ThinkPad X1 Carbon') },
      { name: 'ASUS ROG Zephyrus G14', description: 'Compact gaming laptop with RTX 4070.', price: 1699, stock: 14, categoryId: laptopId, images: img('ASUS ROG Zephyrus G14') },
      { name: 'LG UltraWide 34-inch Monitor', description: 'Boost your productivity with ultrawide screen space.', price: 499, stock: 22, categoryId: laptopId, images: img('LG UltraWide 34-inch Monitor') },
      { name: 'Logitech MX Master 3S', description: 'The ultimate wireless mouse for creators.', price: 99, stock: 85, categoryId: laptopId, images: img('Logitech MX Master 3S') },
      { name: 'Keychron K2 Mechanical Keyboard', description: 'Wireless mechanical keyboard for Mac and Windows.', price: 79, stock: 40, categoryId: laptopId, images: img('Keychron K2 Mechanical Keyboard') },
      { name: 'Samsung Odyssey G7 27-inch', description: '240Hz 1440p gaming monitor.', price: 699, stock: 15, categoryId: laptopId, images: img('Samsung Odyssey G7 27-inch') },
      { name: 'Razer Blade 16 Gaming Laptop', description: 'Dual-mode mini-LED display, RTX 4090.', price: 3999, stock: 5, categoryId: laptopId, images: img('Razer Blade 16 Gaming Laptop') },
      { name: 'WD Black 2TB NVMe SSD', description: 'High-speed NVMe SSD for gaming and creative workloads.', price: 149, stock: 70, categoryId: laptopId, images: img('WD Black 2TB NVMe SSD') },
      { name: 'Elgato Thunderbolt 4 Dock', description: '11-port Thunderbolt 4 hub for a clean, powerful desktop setup.', price: 299, stock: 20, categoryId: laptopId, images: img('Elgato Thunderbolt 4 Dock') },

      { name: 'Sony WH-1000XM5', description: 'Industry leading noise canceling wireless headphones.', price: 398, stock: 55, categoryId: audioId, images: img('Sony WH-1000XM5') },
      { name: 'Apple AirPods Pro (2nd Gen)', description: 'Richer audio experience, 2x more ANC.', price: 249, stock: 120, categoryId: audioId, images: img('Apple AirPods Pro (2nd Gen)') },
      { name: 'Sennheiser Momentum 4', description: 'Audiophile-inspired sound with 60h battery life.', price: 349, stock: 25, categoryId: audioId, images: img('Sennheiser Momentum 4') },
      { name: 'Beats Studio Pro', description: 'Custom acoustic platform, lossless audio.', price: 349, stock: 30, categoryId: audioId, images: img('Beats Studio Pro') },
      { name: 'Audio-Technica ATH-M50x', description: 'Professional studio monitor headphones.', price: 169, stock: 18, categoryId: audioId, images: img('Audio-Technica ATH-M50x') },
      { name: 'Samsung Galaxy Buds 2 Pro', description: 'Hi-Fi 24bit audio, intelligent ANC.', price: 229, stock: 45, categoryId: audioId, images: img('Samsung Galaxy Buds 2 Pro') },
      { name: 'Jabra Evolve2 85', description: 'Enterprise-grade wireless headset with supreme ANC.', price: 449, stock: 15, categoryId: audioId, images: img('Jabra Evolve2 85') },
      { name: 'Bowers & Wilkins Px8', description: 'Luxury over-ear headphones with premium craftsmanship.', price: 699, stock: 8, categoryId: audioId, images: img('Bowers & Wilkins Px8') },
      { name: 'Sony LinkBuds S', description: 'Featherlight earbuds with ANC and ambient sound mode.', price: 149, stock: 60, categoryId: audioId, images: img('Sony LinkBuds S') },

      { name: 'Apple Watch Ultra 2', description: 'The most rugged and capable Apple Watch.', price: 799, stock: 18, categoryId: homeId, images: img('Apple Watch Ultra 2') },
      { name: 'Samsung Galaxy Watch 6 Classic', description: 'Timeless design with rotating bezel.', price: 399, stock: 25, categoryId: homeId, images: img('Samsung Galaxy Watch 6 Classic') },
      { name: 'Garmin Fenix 7 Pro', description: 'Multisport GPS watch with solar charging.', price: 899, stock: 10, categoryId: homeId, images: img('Garmin Fenix 7 Pro') },
      { name: 'Oura Ring Gen 3', description: 'Discreet smart ring for sleep and health tracking.', price: 299, stock: 35, categoryId: homeId, images: img('Oura Ring Gen 3') },
      { name: 'Google Nest Hub Max', description: 'Smart display for video calls and home control.', price: 229, stock: 20, categoryId: homeId, images: img('Google Nest Hub Max') },
      { name: 'Ring Video Doorbell Pro 2', description: 'Premium wired video doorbell with 3D motion detection.', price: 249, stock: 25, categoryId: homeId, images: img('Ring Video Doorbell Pro 2') },
      { name: 'Ecobee Smart Thermostat Premium', description: 'Save energy and monitor indoor air quality.', price: 249, stock: 15, categoryId: homeId, images: img('Ecobee Smart Thermostat Premium') },
      { name: 'Fitbit Charge 6', description: 'Advanced fitness and health tracker.', price: 159, stock: 50, categoryId: homeId, images: img('Fitbit Charge 6') },
      { name: 'Arlo Pro 5 Security Camera', description: 'Wire-free outdoor 4K camera with color night vision.', price: 199, stock: 30, categoryId: homeId, images: img('Arlo Pro 5 Security Camera') },
      { name: 'Withings Body+ Smart Scale', description: 'Full body composition analysis synced to your phone.', price: 99, stock: 45, categoryId: homeId, images: img('Withings Body+ Smart Scale') },

      { name: 'PlayStation 5 Slim Console', description: 'Next-gen gaming with lightning-fast SSD.', price: 499, stock: 45, categoryId: gamingId, images: img('PlayStation 5 Slim Console') },
      { name: 'Xbox Series X', description: 'The fastest, most powerful Xbox ever.', price: 499, stock: 40, categoryId: gamingId, images: img('Xbox Series X') },
      { name: 'Nintendo Switch OLED', description: 'Vibrant 7-inch OLED screen for portable gaming.', price: 349, stock: 60, categoryId: gamingId, images: img('Nintendo Switch OLED') },
      { name: 'Valve Steam Deck OLED', description: 'Your PC games, anywhere. Premium OLED screen.', price: 549, stock: 15, categoryId: gamingId, images: img('Valve Steam Deck OLED') },
      { name: 'Meta Quest 3 VR Headset', description: 'Breakthrough mixed reality and powerful performance.', price: 499, stock: 25, categoryId: gamingId, images: img('Meta Quest 3 VR Headset') },
      { name: 'DualSense Wireless Controller', description: 'Haptic feedback and adaptive triggers for PS5.', price: 69, stock: 100, categoryId: gamingId, images: img('DualSense Wireless Controller') },
      { name: 'Xbox Elite Wireless Controller S2', description: 'Play like a pro with adjustable tension.', price: 179, stock: 20, categoryId: gamingId, images: img('Xbox Elite Wireless Controller S2') },
      { name: 'Razer DeathAdder V3 Pro', description: 'Ultra-lightweight wireless esports mouse.', price: 149, stock: 35, categoryId: gamingId, images: img('Razer DeathAdder V3 Pro') },
      { name: 'Elgato Stream Deck MK.2', description: '15 customizable LCD keys to control your stream.', price: 149, stock: 22, categoryId: gamingId, images: img('Elgato Stream Deck MK.2') },
      { name: 'ASUS ROG Ally Gaming Handheld', description: 'Windows 11 handheld with AMD Z1 Extreme for PC gaming on the go.', price: 699, stock: 12, categoryId: gamingId, images: img('ASUS ROG Ally Gaming Handheld') },
      { name: 'Corsair K100 RGB Keyboard', description: 'Flagship mechanical keyboard with OPX optical switches.', price: 229, stock: 22, categoryId: gamingId, images: img('Corsair K100 RGB Keyboard') },
      { name: 'Secretlab TITAN Evo Chair', description: 'Award-winning ergonomic gaming chair for long sessions.', price: 549, stock: 10, categoryId: gamingId, images: img('Secretlab TITAN Evo Chair') },
    ];

    const productsWithSlugs = productsData.map((prod, index) => ({ 
      ...prod, 
      slug: slugify(prod.name),
      sku: `ELEC-${1000 + index}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    }));
    await Product.insertMany(productsWithSlugs);

    console.log('🔥 53 REALISTIC PRODUCTS SEEDED SUCCESSFULLY! 🔥');
    process.exit();

  } catch (error) {
    console.error('FUCK! Something broke: ', error.message);
    process.exit(1);
  }
};

seedDatabase();