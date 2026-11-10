/* =========================================================
   Mkurugenzi — product catalogue
   Prices in KSh. Images are linked from the current site; if one
   fails to load, a drawn placeholder in the product colour shows.
   When the backend is ready, replace this file with an API call
   that returns the same shape.

   cat: "gents" | "ladies" | "unisex"
   type: tee | crop | hoodie | sweatsuit | jacket | quarterzip | cap | tote | socks
   price: null  -> shown as "Price coming soon", can't be added to cart
   ========================================================= */
/* Where images load from. To host images yourself, run
   download-images.sh and change this to "images/". */
const IMG = "images/"; // local copies of the original mkurugenzi.ke images

/* Original brand assets from mkurugenzi.ke */
const BRAND = {
  logo: IMG + "2024/04/black-1-of-1-2048x2048.png", // black signature logo, transparent background
  slides: [
    { img: IMG + "2026/09/9.png", alt: "Mkurugenzi socks with white sneakers against a golf course" },
    { img: IMG + "2026/08/2-3.png", alt: "Two models in Mkurugenzi quarter zips" },
    { img: IMG + "2026/09/12.png", alt: "Mkurugenzi lookbook" },
    { img: IMG + "2026/09/3.png", alt: "Mkurugenzi lookbook" },
  ],
  categories: { ladies: IMG + "2026/09/a.png", gents: IMG + "2026/09/b.png", unisex: IMG + "2026/08/379-scaled.jpg" },
};
const APPAREL = ["S", "M", "L", "XL", "XXL"];

const PRODUCTS = [
  // ---- Splatter (Nov drop) ----
  { id: "tee-coffee-brown-splatter", name: "Coffee Brown Splatter Tee", cat: "gents", type: "tee", collection: "Splatter", price: 1800, swatch: "#5B3A29", img: IMG + "2026/11/Coffe-Brown-Splatter-768x960.png", sizes: APPAREL, isNew: true },
  { id: "tee-black-splatter", name: "Black Splatter Tee", cat: "gents", type: "tee", collection: "Splatter", price: 1800, swatch: "#1C1714", img: IMG + "2026/11/black-tshirt-patch-768x960.png", sizes: APPAREL, isNew: true },
  { id: "tee-white-splatter", name: "White Splatter Tee", cat: "gents", type: "tee", collection: "Splatter", price: 1800, swatch: "#F7F4EE", img: IMG + "2026/11/white-tshirt-patch-768x960.png", sizes: APPAREL, isNew: true },

  // ---- Muse crop tees (Nov drop) ----
  { id: "crop-muse-black", name: "Muse Crop Tee, Black", cat: "ladies", type: "crop", collection: "Muse", price: 1500, swatch: "#1C1714", img: IMG + "2026/11/black-top-768x960.png", sizes: ["XS", "S", "M", "L", "XL"], isNew: true },
  { id: "crop-muse-white", name: "Muse Crop Tee, White", cat: "ladies", type: "crop", collection: "Muse", price: 1500, swatch: "#F7F4EE", img: IMG + "2026/11/white-top-768x960.png", sizes: ["XS", "S", "M", "L", "XL"], isNew: true },
  { id: "crop-muse-coffee-brown", name: "Muse Crop Tee, Coffee Brown", cat: "ladies", type: "crop", collection: "Muse", price: 1500, swatch: "#5B3A29", img: IMG + "2026/11/MK-Muse-Coffee-Brown-768x960.png", sizes: ["XS", "S", "M", "L", "XL"], isNew: true },

  // ---- Botanical ----
  { id: "tee-white-botanical", name: "White Botanical Tee", cat: "gents", type: "tee", collection: "Botanical", price: 1800, swatch: "#F7F4EE", img: IMG + "2026/10/Botanical-white-819x1024.png", sizes: APPAREL },
  { id: "tee-dark-burgundy-botanical", name: "Dark Burgundy Botanical Tee", cat: "gents", type: "tee", collection: "Botanical", price: 1800, swatch: "#4E1B22", img: IMG + "2026/10/Botanical-Dark-Burgundy-819x1024.png", sizes: APPAREL },
  { id: "tee-black-botanical", name: "Black Botanical Tee", cat: "gents", type: "tee", collection: "Botanical", price: 1800, swatch: "#1C1714", img: IMG + "2026/10/Botanical-Black-819x1024.png", sizes: APPAREL },

  // ---- Essentials tees ----
  { id: "tee-black-excellence", name: "Black Excellence Tee", cat: "gents", type: "tee", collection: "Black Excellence", price: 1500, swatch: "#1C1714", img: IMG + "2026/01/black-tshirt-2-819x1024.webp", sizes: APPAREL },
  { id: "tee-desert-taupe", name: "Desert Taupe Tee", cat: "gents", type: "tee", collection: "Essentials", price: 1500, swatch: "#8F7B67", img: IMG + "2026/01/Desert-Taupe-Tshirt-819x1024.webp", sizes: APPAREL },
  { id: "tee-faded-navy", name: "Faded Navy Tee", cat: "gents", type: "tee", collection: "Essentials", price: 1500, swatch: "#3C4A5E", img: IMG + "2026/01/tshirt-navy-bluer-1-819x1024.webp", sizes: APPAREL },
  { id: "tee-desert-sand", name: "Desert Sand Tee", cat: "ladies", type: "tee", collection: "Essentials", price: 1500, swatch: "#D2BC98", img: IMG + "2026/01/Beige-Tshirt-819x1024.webp", sizes: APPAREL },
  { id: "tee-white-luxe", name: "White Luxe Tee", cat: "ladies", type: "tee", collection: "Essentials", price: 1500, swatch: "#F7F4EE", img: IMG + "2026/01/White-tshirt-819x1024.webp", sizes: APPAREL },
  { id: "tee-burgundy-bliss", name: "Burgundy Bliss Tee", cat: "ladies", type: "tee", collection: "Essentials", price: 1500, swatch: "#6B2530", img: IMG + "2026/01/Burgundy-Tshirt-819x1024.webp", sizes: APPAREL },

  // ---- Hoodies ----
  { id: "hoodie-black-excellence", name: "Black Excellence Hoodie", cat: "unisex", type: "hoodie", collection: "Black Excellence", price: 2500, compareAt: 3000, swatch: "#1C1714", img: IMG + "2026/10/Black-Excellence-819x1024.png", sizes: APPAREL },
  { id: "hoodie-charcoal-grey", name: "Charcoal Grey Hoodie", cat: "unisex", type: "hoodie", collection: "Essentials", price: 3000, swatch: "#45464A", img: IMG + "2026/10/Charcoal-grey-819x1024.png", sizes: APPAREL },
  { id: "hoodie-desert-sand", name: "Desert Sand Hoodie", cat: "unisex", type: "hoodie", collection: "Essentials", price: 3000, swatch: "#D2BC98", img: IMG + "2026/10/Desert-Sand-819x1024.png", sizes: APPAREL },

  // ---- Sweatsuits ----
  { id: "sweatsuit-black-excellence", name: "Black Excellence Sweatsuit", cat: "unisex", type: "sweatsuit", collection: "Sweatsuits", price: 6500, swatch: "#1C1714", img: IMG + "2026/08/290-731x1024.jpg", sizes: APPAREL },
  { id: "sweatsuit-ivory-essence", name: "Ivory Essence Sweatsuit", cat: "unisex", type: "sweatsuit", collection: "Sweatsuits", price: 6500, swatch: "#EDE4D0", img: IMG + "2026/08/342-732x1024.jpg", sizes: APPAREL },
  { id: "sweatsuit-coffee-brown", name: "Coffee Brown Sweatsuit", cat: "unisex", type: "sweatsuit", collection: "Sweatsuits", price: 6500, swatch: "#5B3A29", img: IMG + "2026/08/309-732x1024.jpg", sizes: APPAREL },
  { id: "ladies-sweatsuit-soft-grey", name: "Ladies Sweatsuit, Soft Grey", cat: "ladies", type: "sweatsuit", collection: "Sweatsuits", price: 6750, swatch: "#B9B6B1", img: IMG + "2026/08/395-731x1024.jpg", sizes: ["XS", "S", "M", "L", "XL"] },
  { id: "ladies-sweatsuit-black-excellence", name: "Ladies Sweatsuit, Black Excellence", cat: "ladies", type: "sweatsuit", collection: "Sweatsuits", price: 6750, swatch: "#1C1714", img: IMG + "2026/08/512-731x1024.jpg", sizes: ["XS", "S", "M", "L", "XL"] },
  { id: "ladies-sweatsuit-burgundy-bliss", name: "Ladies Sweatsuit, Burgundy Bliss", cat: "ladies", type: "sweatsuit", collection: "Sweatsuits", price: 6750, swatch: "#6B2530", img: IMG + "2026/08/476-732x1024.jpg", sizes: ["XS", "S", "M", "L", "XL"] },

  // ---- Outerwear ----
  { id: "jacket-black-icon", name: "Black Icon Jacket", cat: "gents", type: "jacket", collection: "Outerwear", price: 3500, swatch: "#1C1714", img: IMG + "2026/08/458-683x1024.jpg", sizes: APPAREL },
  { id: "quarter-zip-desert-sand", name: "Desert Sand Quarter Zip", cat: "gents", type: "quarterzip", collection: "Outerwear", price: null, swatch: "#D2BC98", img: IMG + "2026/08/237-1-731x1024.jpg", sizes: APPAREL },
  { id: "quarter-zip-black-excellence", name: "Black Excellence Quarter Zip", cat: "gents", type: "quarterzip", collection: "Outerwear", price: null, swatch: "#1C1714", img: IMG + "2026/08/122-1-1-683x1024.jpg", sizes: APPAREL },

  // ---- Accessories ----
  { id: "aero-cap-brown-beige", name: "Aero Cap, Brown & Beige", cat: "unisex", type: "cap", collection: "Aero Caps", price: 1500, swatch: "#5B3A29", img: IMG + "2026/10/cap-1-819x1024.png", sizes: ["One size"] },
  { id: "aero-cap-black-white", name: "Aero Cap, Black & White", cat: "unisex", type: "cap", collection: "Aero Caps", price: 1500, swatch: "#1C1714", img: IMG + "2026/10/cap-3-819x1024.png", sizes: ["One size"] },
  { id: "aero-cap-black", name: "Aero Cap, Black", cat: "unisex", type: "cap", collection: "Aero Caps", price: 1500, swatch: "#1C1714", img: IMG + "2026/10/cap-2-819x1024.png", sizes: ["One size"] },
  { id: "tote-bag-black", name: "Tote Bag, Black", cat: "ladies", type: "tote", collection: "Accessories", price: 2500, swatch: "#1C1714", img: IMG + "2026/02/Tote-Resized-819x1024.png", sizes: ["One size"] },
  { id: "socks-pack-of-3", name: "Socks, Pack of 3", cat: "unisex", type: "socks", collection: "Accessories", price: 1000, swatch: "#EDE4D0", img: IMG + "2026/09/87047815-30b6-46c8-881f-30520e5d72ea-1-683x1024.png", sizes: ["One size"] },
];

/* Short descriptions per product type (used on product pages). */
const TYPE_INFO = {
  tee: { label: "T-shirts", copy: "Heavyweight cotton tee with a relaxed fit and a ribbed neck that keeps its shape wash after wash.", care: "Wash cold inside out. Do not iron on the print." },
  crop: { label: "Crop tees", copy: "Cropped cotton tee cut to sit at the waist. Pairs with high-rise trousers or the matching sweatpants.", care: "Wash cold inside out. Dry flat." },
  hoodie: { label: "Hoodies", copy: "Brushed-fleece hoodie with a lined hood, kangaroo pocket and ribbed cuffs.", care: "Wash cold with similar colours. Tumble dry low." },
  sweatsuit: { label: "Sweatsuits", copy: "Matching hoodie and joggers in brushed fleece, sold as a set. Elastic waist with drawcord and tapered ankle.", care: "Wash cold with similar colours. Tumble dry low." },
  jacket: { label: "Jackets", copy: "Lightweight jacket with a full zip, stand collar and side pockets.", care: "Machine wash cold, gentle cycle. Hang to dry." },
  quarterzip: { label: "Quarter zips", copy: "Mid-weight pullover with a quarter-length zip and stand collar.", care: "Wash cold. Dry flat." },
  cap: { label: "Caps", copy: "Six-panel cap with an embroidered mark and an adjustable strap.", care: "Spot clean only." },
  tote: { label: "Bags", copy: "Heavy canvas tote with long handles and room for a laptop.", care: "Spot clean or hand wash cold." },
  socks: { label: "Socks", copy: "Three pairs of cushioned crew socks in cotton blend.", care: "Machine wash warm." },
};

const CATEGORIES = {
  gents: { name: "Gents", blurb: "Tees, outerwear and layers cut for him." },
  ladies: { name: "Ladies", blurb: "Crop tees, matched sweatsuits and everyday essentials." },
  unisex: { name: "Unisex", blurb: "Hoodies, sweatsuits, caps and socks made to be shared." },
};

/* Delivery options — PLACEHOLDER fees, confirm with the client. */
const DELIVERY = [
  { id: "pickup", name: "Pick up in Nairobi CBD", eta: "Ready next working day", fee: 0 },
  { id: "nairobi", name: "Nairobi delivery", eta: "Same or next day", fee: 300 },
  { id: "countrywide", name: "Countrywide courier", eta: "1 to 3 working days", fee: 500 },
];

/* Store contact details. Email and hours are PLACEHOLDERS. */
const STORE = {
  whatsapp: "254716265661",
  phoneDisplay: "+254 716 265 661",
  email: "hello@mkurugenzi.ke",
  location: "Nairobi, Kenya",
  hours: "Mon to Sat, 9am to 6pm",
  usdRate: 129, // KSh per USD for the PayPal estimate — placeholder
};
