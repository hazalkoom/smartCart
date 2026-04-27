const mongoose = require('mongoose');
const dotenv = require('dotenv');

// CHANGE THESE PATHS IF YOUR MODELS ARE SOMEWHERE ELSE
const Product = require('./src/models/productModel'); 
const Category = require('./src/models/categoryModel');
const Review = require('./src/models/reviewModel');

dotenv.config();

const categoriesData = [
  { name: 'Smartphones & Accessories', description: 'Latest mobile phones, cases, and fast chargers.' },
  { name: 'Laptops & Computers', description: 'High-performance laptops, desktops, and monitors.' },
  { name: 'Audio & Headphones', description: 'Premium wireless headphones, earbuds, and Bluetooth speakers.' },
  { name: 'Smart Home & Wearables', description: 'Smartwatches, fitness trackers, and smart home automation devices.' },
  { name: 'Gaming & Consoles', description: 'Video game consoles, VR headsets, and gaming accessories.' }
  ,{ name: 'Apple Ecosystem', description: 'All things Apple: devices, accessories, and exclusive gear.' }
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
  'Secretlab TITAN Evo Chair': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772098125/Secretlab_TITAN_Evo_Chair_unfhut.jpg',
  'Sony Xperia 1 V': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772543002/Sony_Xperia_1_V_oz4tlc.png',
  'Apple Mac Mini M2': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772543001/Apple_Mac_Mini_M2_kcnjec.jpg',
  'Bose QuietComfort Ultra': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772543001/Bose_QuietComfort_Ultra_heyl0m.jpg',
  'Philips Hue Starter Kit': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772543016/Philips_Hue_Starter_Kit_vdvjbq.png',
  'Nintendo Switch Pro Controller': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1772543005/Nintendo_Switch_Pro_Controller_e3py6v.jpg',
  'Logitech G Pro X Superlight Mouse': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773316371/Logitech_G_Pro_X_Superlight_Mouse_ytescq.webp',
  'SteelSeries Arctis Nova Pro': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773316371/SteelSeries_Arctis_Nova_Pro_w28rka.jpg',
  'HyperX Cloud III Gaming Headset': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773316369/HyperX_Cloud_III_Gaming_Headset_vygrar.jpg',
  'Acer Predator X34 Curved Monitor': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773316371/Acer_Predator_X34_Curved_Monitor_znsvjj.jpg',
  'Thrustmaster T248 Racing Wheel': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773316369/Thrustmaster_T248_Racing_Wheel_lpthxm.jpg',
  'Alienware Aurora R16 Gaming PC': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773316371/Alienware_Aurora_R16_Gaming_PC_r4jiqe.jpg',
  'HP OMEN 45L Gaming Desktop': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773316371/HP_OMEN_45L_Gaming_Desktop_tr0xlu.jpg',
  'Corsair Vengeance i7500 Gaming PC': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773316453/Corsair_Vengeance_i7500_Gaming_PC_tlkwxq.jpg',
  'MSI Aegis RS Gaming Desktop': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773316371/MSI_Aegis_RS_Gaming_Desktop_bzumxc.jpg',
  'ASUS ROG Strix G35 Gaming Desktop': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773316369/ASUS_ROG_Strix_G35_Gaming_Desktop_ekwfo4.jpg',
  'Anker Prime 27650mAh Power Bank': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1776019876/Anker_Prime_27650mAh_Power_Bank_zlfk1l.jpg',
  'Spigen MagFit Card Holder': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1776019876/Spigen_MagFit_Card_Holder_vnzpff.jpg',
  'CalDigit TS4 Thunderbolt Dock': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1776019876/CalDigit_TS4_Thunderbolt_Dock_zlhsqn.jpg',
  'BenQ PD3225U Designer Monitor': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1776019875/BenQ_PD3225U_Designer_Monitor_casudb.jpg',
  'Sonos Era 100 Smart Speaker': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1776019875/Sonos_Era_100_Smart_Speaker_o2guzn.jpg',
  'Shure MV7+ Podcast Microphone': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1776019875/Shure_MV7_Podcast_Microphone_oxwhsm.jpg',
  'Aqara Smart Lock U100': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1776019875/Aqara_Smart_Lock_U100_jho7wx.jpg',
  'Nanoleaf Shapes Hexagon Starter Kit': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1776019876/Nanoleaf_Shapes_Hexagon_Starter_Kit_wo4xds.jpg',
  'Logitech G923 Racing Wheel': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1776019877/Logitech_G923_Racing_Wheel_agexe6.jpg',
  'Elgato HD60 X Capture Card': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1776019877/Elgato_HD60_X_Capture_Card_axngda.jpg',
  'Apple Pencil Pro': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1776019876/Apple_Pencil_Pro_re47hc.jpg',
  'Apple AirPods Max (USB-C)': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1776019876/Apple_AirPods_Max_USB-C_s3n6ln.png',
  // Apple Ecosystem (empty links)
  'Apple Vision Pro': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773912762/Apple_Vision_Pro_iq7wzo.jpg',
  'Apple HomePod (2nd Gen)': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773912759/Apple_HomePod_2nd_Gen_gnadax.jpg',
  'Apple AirTag 4-Pack': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773912762/Apple_AirTag_4-Pack_elbyoj.jpg',
  'Apple Magic Keyboard with Touch ID': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773912760/Apple_Magic_Keyboard_with_Touch_ID_nzumoy.jpg',
  'Apple Magic Mouse': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773912761/Apple_Magic_Mouse_ptzgdo.jpg',
  'Apple Studio Display': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773912759/Apple_Studio_Display_iej7xf.jpg',
  'Apple Thunderbolt 4 Pro Cable (3m)': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773912761/Apple_Thunderbolt_4_Pro_Cable_3m_zygkks.jpg',
  'Apple Leather Wallet with MagSafe': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773912765/Apple_Leather_Wallet_with_MagSafe_m9hwi2.png',
  'Apple 140W USB-C Power Adapter': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773912759/Apple_140W_USB-C_Power_Adapter_mxtom0.jpg',
  'AppleCare+ for MacBook Pro': 'https://res.cloudinary.com/dgysa5pgp/image/upload/v1773912759/AppleCare_for_MacBook_Pro_zsgxsn.jpg',
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
    await Review.deleteMany();
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
      const appleId  = createdCategories[5]._id;

    console.log('Generating 90 Realistic Products...');
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
      { name: 'Sony Xperia 1 V', description: 'Pro-level camera phone with 4K OLED display.', price: 1199, stock: 15, categoryId: phoneId, images: img('Sony Xperia 1 V') },
      { name: 'Anker Prime 27650mAh Power Bank', description: 'Ultra-capacity power bank with high-speed USB-C output for laptops and phones.', price: 179, stock: 35, categoryId: phoneId, images: img('Anker Prime 27650mAh Power Bank') },
      { name: 'Spigen MagFit Card Holder', description: 'Magnetic card wallet attachment for daily carry convenience.', price: 39, stock: 90, categoryId: phoneId, images: img('Spigen MagFit Card Holder') },

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
      { name: 'Apple Mac Mini M2', description: 'Compact desktop powerhouse.', price: 599, stock: 30, categoryId: laptopId, images: img('Apple Mac Mini M2') },
      { name: 'CalDigit TS4 Thunderbolt Dock', description: 'Pro dock with wide connectivity for creator and workstation setups.', price: 399, stock: 16, categoryId: laptopId, images: img('CalDigit TS4 Thunderbolt Dock') },
      { name: 'BenQ PD3225U Designer Monitor', description: 'Color-accurate 4K monitor tuned for professional design workflows.', price: 1199, stock: 9, categoryId: laptopId, images: img('BenQ PD3225U Designer Monitor') },
      
      { name: 'Sony WH-1000XM5', description: 'Industry leading noise canceling wireless headphones.', price: 398, stock: 55, categoryId: audioId, images: img('Sony WH-1000XM5') },
      { name: 'Apple AirPods Pro (2nd Gen)', description: 'Richer audio experience, 2x more ANC.', price: 249, stock: 120, categoryId: audioId, images: img('Apple AirPods Pro (2nd Gen)') },
      { name: 'Sennheiser Momentum 4', description: 'Audiophile-inspired sound with 60h battery life.', price: 349, stock: 25, categoryId: audioId, images: img('Sennheiser Momentum 4') },
      { name: 'Beats Studio Pro', description: 'Custom acoustic platform, lossless audio.', price: 349, stock: 30, categoryId: audioId, images: img('Beats Studio Pro') },
      { name: 'Audio-Technica ATH-M50x', description: 'Professional studio monitor headphones.', price: 169, stock: 18, categoryId: audioId, images: img('Audio-Technica ATH-M50x') },
      { name: 'Samsung Galaxy Buds 2 Pro', description: 'Hi-Fi 24bit audio, intelligent ANC.', price: 229, stock: 45, categoryId: audioId, images: img('Samsung Galaxy Buds 2 Pro') },
      { name: 'Jabra Evolve2 85', description: 'Enterprise-grade wireless headset with supreme ANC.', price: 449, stock: 15, categoryId: audioId, images: img('Jabra Evolve2 85') },
      { name: 'Bowers & Wilkins Px8', description: 'Luxury over-ear headphones with premium craftsmanship.', price: 699, stock: 8, categoryId: audioId, images: img('Bowers & Wilkins Px8') },
      { name: 'Sony LinkBuds S', description: 'Featherlight earbuds with ANC and ambient sound mode.', price: 149, stock: 60, categoryId: audioId, images: img('Sony LinkBuds S') },
      { name: 'Bose QuietComfort Ultra', description: 'World-class noise cancellation.', price: 429, stock: 40, categoryId: audioId, images: img('Bose QuietComfort Ultra') },
      { name: 'Sonos Era 100 Smart Speaker', description: 'Compact smart speaker with rich stereo sound for every room.', price: 249, stock: 28, categoryId: audioId, images: img('Sonos Era 100 Smart Speaker') },
      { name: 'Shure MV7+ Podcast Microphone', description: 'Hybrid USB/XLR dynamic microphone for streaming and podcast creators.', price: 299, stock: 24, categoryId: audioId, images: img('Shure MV7+ Podcast Microphone') },

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
      { name: 'Philips Hue Starter Kit', description: 'Smart ambient lighting for your entire room.', price: 199, stock: 25, categoryId: homeId, images: img('Philips Hue Starter Kit') },
      { name: 'Aqara Smart Lock U100', description: 'Matter-ready smart lock with fingerprint and Apple Home support.', price: 189, stock: 26, categoryId: homeId, images: img('Aqara Smart Lock U100') },
      { name: 'Nanoleaf Shapes Hexagon Starter Kit', description: 'Modular smart light panels for immersive room ambience.', price: 229, stock: 21, categoryId: homeId, images: img('Nanoleaf Shapes Hexagon Starter Kit') },

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
      { name: 'Nintendo Switch Pro Controller', description: 'Premium wireless pad for intense gaming.', price: 69, stock: 80, categoryId: gamingId, images: img('Nintendo Switch Pro Controller') },
      { name: 'Logitech G Pro X Superlight Mouse', description: 'Ultra-lightweight wireless gaming mouse designed for esports professionals.', price: 159, stock: 40, categoryId: gamingId, images: img('Logitech G Pro X Superlight Mouse') },
      { name: 'SteelSeries Arctis Nova Pro', description: 'Premium gaming headset with immersive 360° spatial audio.', price: 349, stock: 25, categoryId: gamingId, images: img('SteelSeries Arctis Nova Pro') },
      { name: 'HyperX Cloud III Gaming Headset', description: 'Comfortable gaming headset with crystal-clear microphone.', price: 99, stock: 50, categoryId: gamingId, images: img('HyperX Cloud III Gaming Headset') },
      { name: 'Acer Predator X34 Curved Monitor', description: '34-inch ultrawide curved gaming monitor with high refresh rate.', price: 999, stock: 12, categoryId: gamingId, images: img('Acer Predator X34 Curved Monitor') },
      { name: 'Thrustmaster T248 Racing Wheel', description: 'Force feedback racing wheel for immersive racing simulation.', price: 399, stock: 18, categoryId: gamingId, images: img('Thrustmaster T248 Racing Wheel') },
      { name: 'Alienware Aurora R16 Gaming PC', description: 'High-end gaming desktop with Intel Core i9 processor and RTX 4090 graphics.', price: 3499, stock: 10, categoryId: gamingId, images: img('Alienware Aurora R16 Gaming PC') },
      { name: 'HP OMEN 45L Gaming Desktop', description: 'Extreme performance gaming PC with advanced Cryo Chamber cooling.', price: 2999, stock: 14, categoryId: gamingId, images: img('HP OMEN 45L Gaming Desktop') },
      { name: 'Corsair Vengeance i7500 Gaming PC', description: 'Premium custom-built gaming desktop with powerful liquid cooling.', price: 3299, stock: 12, categoryId: gamingId, images: img('Corsair Vengeance i7500 Gaming PC') },
      { name: 'MSI Aegis RS Gaming Desktop', description: 'Performance-focused gaming PC designed for esports and 4K gaming.', price: 2699, stock: 18, categoryId: gamingId, images: img('MSI Aegis RS Gaming Desktop') },
      { name: 'ASUS ROG Strix G35 Gaming Desktop', description: 'Aggressive RGB gaming tower built for high frame rate competitive gaming.', price: 2499, stock: 16, categoryId: gamingId, images: img('ASUS ROG Strix G35 Gaming Desktop') },
      { name: 'Logitech G923 Racing Wheel', description: 'TRUEFORCE racing wheel with responsive force feedback for sim racing.', price: 349, stock: 20, categoryId: gamingId, images: img('Logitech G923 Racing Wheel') },
      { name: 'Elgato HD60 X Capture Card', description: 'External capture card for streaming high-quality console gameplay.', price: 199, stock: 33, categoryId: gamingId, images: img('Elgato HD60 X Capture Card') },
        // Apple Ecosystem products
        { name: 'Apple Vision Pro', description: 'Revolutionary spatial computer with ultra-high-resolution displays.', price: 3499, stock: 8, categoryId: appleId, images: img('Apple Vision Pro') },
        { name: 'Apple HomePod (2nd Gen)', description: 'Smart speaker with room-filling sound and Siri integration.', price: 299, stock: 20, categoryId: appleId, images: img('Apple HomePod (2nd Gen)') },
        { name: 'Apple AirTag 4-Pack', description: 'Track your items with precision finding.', price: 99, stock: 50, categoryId: appleId, images: img('Apple AirTag 4-Pack') },
        { name: 'Apple Magic Keyboard with Touch ID', description: 'Wireless keyboard with secure authentication for Mac.', price: 149, stock: 30, categoryId: appleId, images: img('Apple Magic Keyboard with Touch ID') },
        { name: 'Apple Magic Mouse', description: 'Multi-touch wireless mouse for Mac.', price: 79, stock: 40, categoryId: appleId, images: img('Apple Magic Mouse') },
        { name: 'Apple Studio Display', description: '27-inch 5K Retina display with Center Stage.', price: 1599, stock: 10, categoryId: appleId, images: img('Apple Studio Display') },
        { name: 'Apple Thunderbolt 4 Pro Cable (3m)', description: 'High-speed Thunderbolt 4 cable for pro workflows.', price: 159, stock: 25, categoryId: appleId, images: img('Apple Thunderbolt 4 Pro Cable (3m)') },
        { name: 'Apple Leather Wallet with MagSafe', description: 'Attachable wallet for iPhone with Find My support.', price: 59, stock: 35, categoryId: appleId, images: img('Apple Leather Wallet with MagSafe') },
        { name: 'Apple 140W USB-C Power Adapter', description: 'Fast charging for MacBook Pro and more.', price: 99, stock: 28, categoryId: appleId, images: img('Apple 140W USB-C Power Adapter') },
        { name: 'AppleCare+ for MacBook Pro', description: 'Extended warranty and support for your MacBook Pro.', price: 399, stock: 100, categoryId: appleId, images: img('AppleCare+ for MacBook Pro') },
        { name: 'Apple Pencil Pro', description: 'Advanced stylus with squeeze gestures and precision control for creatives.', price: 129, stock: 42, categoryId: appleId, images: img('Apple Pencil Pro') },
        { name: 'Apple AirPods Max (USB-C)', description: 'Premium over-ear headphones with immersive spatial audio and ANC.', price: 549, stock: 22, categoryId: appleId, images: img('Apple AirPods Max (USB-C)') },
    ];

    const productsWithSlugs = productsData.map((prod, index) => ({ 
      ...prod, 
      slug: slugify(prod.name),
      sku: `ELEC-${1000 + index}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    }));
    await Product.insertMany(productsWithSlugs);

    
    console.log('🔥 90 REALISTIC PRODUCTS SEEDED SUCCESSFULLY! 🔥');
    process.exit();

  } catch (error) {
    console.error('FUCK! Something broke: ', error.message);
    process.exit(1);
  }
};

seedDatabase();