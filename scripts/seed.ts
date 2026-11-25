/**
 * Seeds the database with the information already gathered in the previous demo
 * (public listing of the hotel) and the 13 real photographs in /seed-assets.
 *
 *   npm run db:seed            → only seeds an empty database
 *   npm run db:seed -- --force → wipes CONTENT (rooms, photos, facilities, texts) and reseeds.
 *                                Users, booking requests and messages are kept.
 *
 * Every value that has not been confirmed by the hotel is flagged as unconfirmed.
 */
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/lib/server/db";
import { processImage, deleteImageFiles } from "../src/lib/server/images";
import {
  DEFAULT_RESTAURANT,
  DEFAULT_SALON,
  DEFAULT_SETTINGS,
  insertFacility,
  insertPhoto,
  insertRoom,
  listPhotos,
  saveRestaurant,
  saveSalon,
  saveSettings,
} from "../src/lib/server/repo";
import type { PhotoCategory } from "../src/lib/types";

const force = process.argv.includes("--force");
const hasContent = (db.prepare("SELECT COUNT(*) AS n FROM rooms").get() as { n: number }).n > 0;
if (hasContent && !force) {
  console.log("La base contient déjà du contenu. Utilisez --force pour réinitialiser le contenu.");
  process.exit(0);
}

async function main() {
  if (force) {
    for (const p of listPhotos()) await deleteImageFiles(p.fileKey);
    db.exec("DELETE FROM photos; DELETE FROM rooms; DELETE FROM facilities; DELETE FROM settings;");
  }

  const room = (r: Parameters<typeof insertRoom>[0]) => insertRoom(r);
  const single = room({
    slug: "chambre-single",
    name: { fr: "Chambre single", ar: "غرفة فردية" },
    category: { fr: "Single", ar: "فردية" },
    description: { fr: "", ar: "" },
    capacity: null,
    amenities: { fr: [], ar: [] },
    priceDzd: 4500, // listed on the hotel's own website — still to be confirmed
    priceNote: { fr: "Petit-déjeuner inclus", ar: "الفطور مشمول" },
    priceConfirmed: false,
    detailsConfirmed: false,
    published: true,
    sort: 1,
  });
  const double = room({
    slug: "chambre-double",
    name: { fr: "Chambre double", ar: "غرفة مزدوجة" },
    category: { fr: "Double", ar: "مزدوجة" },
    description: { fr: "", ar: "" },
    capacity: null,
    amenities: { fr: [], ar: [] },
    priceDzd: 7000, // listed on the hotel's own website — still to be confirmed
    priceNote: { fr: "Petit-déjeuner inclus", ar: "الفطور مشمول" },
    priceConfirmed: false,
    detailsConfirmed: false,
    published: true,
    sort: 2,
  });
  const twin = room({
    slug: "chambre-deux-lits",
    name: { fr: "Chambre à deux lits", ar: "غرفة بسريرين" },
    category: { fr: "Twin", ar: "بسريرين" },
    description: { fr: "", ar: "" },
    capacity: null,
    amenities: { fr: [], ar: [] },
    priceDzd: null,
    priceNote: { fr: "", ar: "" },
    priceConfirmed: false,
    detailsConfirmed: false,
    published: true,
    sort: 3,
  });
  void single;

  const photos: [string, PhotoCategory, string, string, number | null][] = [
    ["facade-nuit.jpg", "hotel", "Façade de l’Hôtel El Sahel de nuit, rue Mohamed Lazzouni", "واجهة فندق الساحل ليلًا، شارع محمد لزوني", null],
    ["entree.jpg", "hotel", "Entrée de l’hôtel avec auvent en fer forgé et enseigne lumineuse", "مدخل الفندق بمظلة من الحديد المطاوع ولافتة مضيئة", null],
    ["reception.jpg", "hotel", "Réception de l’Hôtel El Sahel avec comptoir et horloges", "استقبال فندق الساحل مع المكتب والساعات", null],
    ["hall.jpg", "facilities", "Hall d’accueil avec fauteuils et écran", "بهو الاستقبال مع مقاعد وشاشة", null],
    ["couloir.jpg", "facilities", "Couloir d’étage avec banquette", "رواق الطابق مع أريكة", null],
    ["chambre-double.jpg", "rooms", "Chambre avec lit double, tête de lit en bois clair et tapis", "غرفة بسرير مزدوج ولوح خشبي فاتح وسجادة", double],
    ["chambre-deux-lits.jpg", "rooms", "Chambre avec deux lits simples et rideaux beiges", "غرفة بسريرين منفردين وستائر بيج", twin],
    ["chambre-deux-lits-fenetre.jpg", "rooms", "Chambre à deux lits près de la fenêtre", "غرفة بسريرين بجانب النافذة", twin],
    ["coin-bureau.jpg", "rooms", "Coin bureau et écran TV dans une chambre", "مكتب وشاشة تلفاز في إحدى الغرف", null],
    ["salle-de-bain.jpg", "rooms", "Salle d’eau avec douche et produits d’accueil", "حمّام مع دُش ومستلزمات الاستحمام", null],
    ["buffet.jpg", "restaurant", "Buffet dans la salle de restauration", "البوفيه في قاعة الإطعام", null],
    ["restaurant.jpg", "restaurant", "Salle de restaurant avec tables dressées", "قاعة المطعم مع طاولات مُعدّة", null],
    ["salon.jpg", "salon", "Salon avec canapé capitonné bleu et tableaux", "صالون بأريكة زرقاء مبطّنة ولوحات", null],
  ];

  const ids: Record<string, number> = {};
  let sort = 0;
  for (const [file, category, altFr, altAr, roomId] of photos) {
    const buf = fs.readFileSync(path.join(process.cwd(), "seed-assets", file));
    const img = await processImage(buf);
    ids[file] = insertPhoto({ ...img, category, alt: { fr: altFr, ar: altAr }, roomId, inGallery: true, sort: sort++ });
    process.stdout.write(".");
  }
  console.log();

  saveSettings({
    ...DEFAULT_SETTINGS,
    intro: {
      fr: "L’Hôtel El Sahel vous accueille au 01 rue Mohamed Lazzouni, à Douéra, dans la wilaya d’Alger. Pour toute demande, la réception est joignable par téléphone.",
      ar: "يرحّب بكم فندق الساحل في 01 شارع محمد لزوني بالدويرة، ولاية الجزائر. للاستفسار، يمكنكم الاتصال بالاستقبال هاتفيًا.",
    },
    address: { fr: "01 rue Mohamed Lazzouni, Douéra, Alger, Algérie", ar: "01 شارع محمد لزوني، الدويرة، الجزائر العاصمة، الجزائر" },
    phones: ["+213 28 50 66 50", "023 14 46 40"],
    email: "elsahelhotel@gmail.com",
    // The hotel's main line, as used by the previous demo. Must be confirmed as a WhatsApp number.
    whatsapp: "21328506650",
    mapsUrl: "https://maps.app.goo.gl/FA4zCU332byTZq2F8",
    mapLat: 36.6695298,
    mapLng: 2.9415437,
    heroPhotoIds: [ids["facade-nuit.jpg"], ids["reception.jpg"], ids["restaurant.jpg"], ids["hall.jpg"]],
    aboutPhotoId: ids["entree.jpg"],
    contactConfirmed: false,
    whatsappConfirmed: false,
  });
  saveRestaurant(DEFAULT_RESTAURANT);
  saveSalon(DEFAULT_SALON);

  // Visible on the hotel's own photos / website; still to be confirmed by management.
  const fac = (icon: string, fr: string, ar: string, dfr: string, dar: string, published: boolean, s: number) =>
    insertFacility({ icon, name: { fr, ar }, description: { fr: dfr, ar: dar }, confirmed: false, published, sort: s });
  fac("bell", "Réception", "الاستقبال", "Accueil des clients à l’entrée de l’hôtel.", "استقبال الضيوف عند مدخل الفندق.", true, 1);
  fac("utensils", "Restaurant", "المطعم", "Salle de restaurant sur place.", "قاعة مطعم داخل الفندق.", true, 2);
  fac("coffee", "Petit-déjeuner", "فطور الصباح", "Inclus dans les tarifs des chambres single et double.", "مشمول في أسعار الغرف الفردية والمزدوجة.", true, 3);
  fac("buffet", "Buffet", "البوفيه", "Service sous forme de buffet.", "خدمة على شكل بوفيه.", true, 4);
  fac("sofa", "Salon", "الصالون", "Espace salon pour se détendre.", "فضاء صالون للراحة.", true, 5);
  // Seen only on third-party directories: hidden until the hotel confirms them.
  fac("parking", "Parking", "موقف السيارات", "", "", false, 6);
  fac("plane", "Navette aéroport", "النقل من وإلى المطار", "", "", false, 7);
  fac("tray", "Service en chambre", "خدمة الغرف", "", "", false, 8);

  console.log("Contenu initial chargé : 3 chambres, 13 photos, 8 services (dont 3 masqués).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
