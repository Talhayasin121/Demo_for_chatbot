(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.OrlandoChatbotData = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  return {
    company: {
      name: "Orlando Auto Repair",
      phoneDisplay: "(407) 412-5103",
      phoneHref: "tel:+14074125103",
      email: "contact@orlandoautorepair.com",
      address: "3327 W Colonial Dr, Orlando, FL 32808, USA",
      mapsUrl: "https://maps.app.goo.gl/",
      bookingUrl: "https://myalp.io/",
      websiteUrl: "https://orlandoautorepair.com/"
    },
    quickReplies: [
      "What services do you offer?",
      "What are your hours?",
      "How do I book an appointment?",
      "Do you offer a warranty?"
    ],
    knowledgeBase: [
      {
        id: "overview",
        title: "Company overview",
        category: "about",
        sourceLabel: "Home",
        sourceUrl: "https://orlandoautorepair.com/",
        tags: ["about", "shop", "repair", "orlando", "auto", "trusted", "full service"],
        answer:
          "Orlando Auto Repair is a full-service auto repair shop in Orlando, Florida focused on trust, transparency, and customer satisfaction.",
        text:
          "The shop describes itself as a trusted full-service auto repair shop in Orlando, FL. It emphasizes top-quality service, affordable pricing, transparent communication, and a stress-free customer experience."
      },
      {
        id: "services-overview",
        title: "Main services",
        category: "services",
        sourceLabel: "Services",
        sourceUrl: "https://orlandoautorepair.com/automotive-repair-service-orlando-fl/",
        tags: [
          "services",
          "maintenance",
          "brakes",
          "ac",
          "diagnostics",
          "inspection",
          "tires",
          "alignment",
          "oil change"
        ],
        answer:
          "We offer general maintenance, brake repairs, tire repairs and rotations, wheel alignments, oil and filter changes, AC repairs, and diagnostics and inspections.",
        text:
          "Orlando Auto Repair presents itself as a one-stop automotive repair shop. Its listed services include routine maintenance, brake repair, tire repair and rotation, wheel alignment, oil and filter changes, AC repair, and diagnostics and inspections."
      },
      {
        id: "general-maintenance",
        title: "General maintenance",
        category: "service-detail",
        sourceLabel: "Services",
        sourceUrl: "https://orlandoautorepair.com/automotive-repair-service-orlando-fl/",
        tags: ["general maintenance", "maintenance", "fluid checks", "belt", "hose", "battery", "routine service"],
        answer:
          "General maintenance includes fluid checks and top-offs, belt and hose inspections, and routine upkeep designed to catch issues early.",
        text:
          "The site says routine maintenance is the foundation of a reliable vehicle and includes fluid checks, top-offs, belt inspections, hose inspections, and related preventive work."
      },
      {
        id: "brake-repairs",
        title: "Brake repairs",
        category: "service-detail",
        sourceLabel: "Services",
        sourceUrl: "https://orlandoautorepair.com/automotive-repair-service-orlando-fl/",
        tags: ["brakes", "brake repair", "pads", "rotors", "abs", "safety"],
        answer:
          "Brake services cover brake pads and rotor replacements as well as more advanced ABS diagnostics.",
        text:
          "The brake repair page says the shop handles pad and rotor replacement plus anti-lock braking system diagnostics, using high-quality parts and precise repair methods."
      },
      {
        id: "tires",
        title: "Tire repairs and rotations",
        category: "service-detail",
        sourceLabel: "Services",
        sourceUrl: "https://orlandoautorepair.com/automotive-repair-service-orlando-fl/",
        tags: ["tires", "rotation", "puncture", "tread", "tire repair"],
        answer:
          "They offer tire repairs and rotations, including puncture repair, wear inspection, and rotation to support safer driving and longer tire life.",
        text:
          "The website says technicians inspect tire wear, repair punctures, and rotate tires to improve tread life, safety, and ride quality."
      },
      {
        id: "alignment",
        title: "Wheel alignments",
        category: "service-detail",
        sourceLabel: "Services",
        sourceUrl: "https://orlandoautorepair.com/automotive-repair-service-orlando-fl/",
        tags: ["alignment", "wheel alignment", "suspension", "handling", "tire wear"],
        answer:
          "Wheel alignment service is meant to correct misalignment, improve handling, reduce uneven tire wear, and support better fuel efficiency.",
        text:
          "The site explains that wheel alignments use advanced equipment to adjust suspension angles so the wheels are properly aligned, improving safety, comfort, and tire life."
      },
      {
        id: "oil-change",
        title: "Oil and filter changes",
        category: "service-detail",
        sourceLabel: "Services",
        sourceUrl: "https://orlandoautorepair.com/automotive-repair-service-orlando-fl/",
        tags: ["oil", "oil change", "filter", "engine health", "maintenance interval"],
        answer:
          "The shop offers oil and filter changes using oils and filters matched to the vehicle to support engine health and fuel efficiency.",
        text:
          "Its oil change service is described as quick and efficient, with oil and filter choices based on the vehicle's needs to help maintain engine performance."
      },
      {
        id: "ac-repairs",
        title: "AC repairs",
        category: "service-detail",
        sourceLabel: "Services",
        sourceUrl: "https://orlandoautorepair.com/automotive-repair-service-orlando-fl/",
        tags: ["ac", "air conditioning", "refrigerant", "compressor", "cooling", "hvac"],
        answer:
          "AC repair covers issues such as refrigerant leaks, recharges, compressor problems, and other air-conditioning system repairs.",
        text:
          "The services page says Orlando Auto Repair diagnoses and repairs AC issues ranging from refrigerant leaks and recharges to component replacement so the system works efficiently."
      },
      {
        id: "diagnostics",
        title: "Diagnostics and inspections",
        category: "service-detail",
        sourceLabel: "Services",
        sourceUrl: "https://orlandoautorepair.com/automotive-repair-service-orlando-fl/",
        tags: ["diagnostics", "inspection", "check engine", "scan", "troubleshooting"],
        answer:
          "The shop provides diagnostics and inspections using advanced tools to identify issues and build a repair plan.",
        text:
          "Their diagnostics service includes reading error codes, inspecting the vehicle, identifying the underlying issue, and recommending next repair steps."
      },
      {
        id: "hours",
        title: "Opening hours",
        category: "operations",
        sourceLabel: "Contact",
        sourceUrl: "https://orlandoautorepair.com/contact-us/",
        tags: ["hours", "open", "closed", "schedule", "monday", "saturday", "sunday"],
        answer:
          "Opening hours listed on the website are Monday through Friday from 8:00 AM to 6:00 PM, Saturday from 8:00 AM to 2:00 PM, and Sunday closed.",
        text:
          "The site says the shop is open six days a week. Weekday hours are 8:00 AM to 6:00 PM, Saturday is 8:00 AM to 2:00 PM, and Sunday is closed."
      },
      {
        id: "contact",
        title: "Phone, email, and reply time",
        category: "operations",
        sourceLabel: "Contact",
        sourceUrl: "https://orlandoautorepair.com/contact-us/",
        tags: ["phone", "email", "contact", "call", "message", "reply"],
        answer:
          "You can contact Orlando Auto Repair by phone at (407) 412-5103 or by email at contact@orlandoautorepair.com. The site says they reply within one day.",
        text:
          "The contact page lists the main phone number, the company email address, and notes that staff typically reply within one day."
      },
      {
        id: "location",
        title: "Location",
        category: "operations",
        sourceLabel: "Contact",
        sourceUrl: "https://orlandoautorepair.com/contact-us/",
        tags: ["location", "address", "directions", "where", "map", "orlando"],
        answer:
          "The shop is located at 3327 W Colonial Dr, Orlando, FL 32808, USA.",
        text:
          "The site provides the shop address as 3327 W Colonial Dr, Orlando, FL 32808, USA and links to directions in Google Maps."
      },
      {
        id: "booking",
        title: "Appointments and booking",
        category: "operations",
        sourceLabel: "Home",
        sourceUrl: "https://orlandoautorepair.com/",
        tags: ["book", "booking", "appointment", "schedule", "reserve", "online booking"],
        answer:
          "Customers can book an appointment through the online booking link on the website or call the shop directly.",
        text:
          "The website highlights an online booking option and also says appointments can be scheduled by calling the shop."
      },
      {
        id: "warranty",
        title: "Warranty",
        category: "trust",
        sourceLabel: "Home FAQ",
        sourceUrl: "https://orlandoautorepair.com/",
        tags: ["warranty", "napa", "parts", "labor", "guarantee"],
        answer:
          "The website says repairs are backed by a NAPA parts and labor warranty for 24 months or 24,000 miles.",
        text:
          "Orlando Auto Repair says its work is supported by a NAPA warranty covering parts and labor for 24 months or 24,000 miles."
      },
      {
        id: "makes-models",
        title: "Makes and models served",
        category: "trust",
        sourceLabel: "Home FAQ",
        sourceUrl: "https://orlandoautorepair.com/",
        tags: ["makes", "models", "brands", "mercedes", "jaguar", "volvo", "cadillac", "toyota", "honda"],
        answer:
          "Yes. Orlando Auto Repair services all makes and models.",
        text:
          "The site explicitly says it services all makes and models and shows examples such as Volkswagen, Mercedes, Jaguar, Volvo, Cadillac, Toyota, Honda, Ford, Chevrolet, GMC, Jeep, Subaru, Hyundai, and more."
      },
      {
        id: "certifications",
        title: "Technician certifications",
        category: "trust",
        sourceLabel: "Home",
        sourceUrl: "https://orlandoautorepair.com/",
        tags: ["ase", "certified", "a1", "a8", "master tech", "manager", "julio"],
        answer:
          "The site says its technicians are ASE-Certified Master Technicians and hold A1 through A8 Master Certifications.",
        text:
          "The home page states that the mechanics are ASE certified and hold A1-A8 Master Certifications. The about page also highlights manager Julio Calderon's 25-plus years of experience in automotive technology."
      },
      {
        id: "buy-sell",
        title: "Buying or selling a car",
        category: "sales",
        sourceLabel: "Home FAQ",
        sourceUrl: "https://orlandoautorepair.com/",
        tags: ["buy", "sell", "trade", "dealership", "orlando preowned"],
        answer:
          "The website says the company can help customers buy or sell a car through Orlando Preowned.",
        text:
          "Orlando Auto Repair links customers to Orlando Preowned for vehicle buying, selling, trading, and upgrades."
      },
      {
        id: "maintenance-frequency",
        title: "Routine maintenance frequency",
        category: "faq",
        sourceLabel: "Services FAQ",
        sourceUrl: "https://orlandoautorepair.com/automotive-repair-service-orlando-fl/",
        tags: ["how often", "maintenance", "service interval", "miles", "routine"],
        answer:
          "Most vehicles benefit from routine maintenance every 5,000 to 10,000 miles, depending on make and model.",
        text:
          "Its FAQ explains that maintenance intervals vary by vehicle, but many cars benefit from service every 5,000 to 10,000 miles."
      },
      {
        id: "oil-frequency",
        title: "Oil change frequency",
        category: "faq",
        sourceLabel: "Services FAQ",
        sourceUrl: "https://orlandoautorepair.com/automotive-repair-service-orlando-fl/",
        tags: ["oil frequency", "oil interval", "how often oil change", "3000", "5000"],
        answer:
          "It is best to follow the vehicle manufacturer's guidelines, commonly around every 3,000 to 5,000 miles depending on driving conditions and oil type.",
        text:
          "The oil change FAQ says intervals depend on the vehicle, driving conditions, and oil type, and points customers to the manufacturer's recommendations."
      },
      {
        id: "tire-rotation-frequency",
        title: "Tire rotation frequency",
        category: "faq",
        sourceLabel: "Services FAQ",
        sourceUrl: "https://orlandoautorepair.com/automotive-repair-service-orlando-fl/",
        tags: ["tire rotation", "how often rotate tires", "5000", "7500"],
        answer:
          "Tires should generally be rotated every 5,000 to 7,500 miles.",
        text:
          "The FAQ explains that regular tire rotation helps manage wear and extend tire life, with a suggested interval of 5,000 to 7,500 miles."
      },
      {
        id: "check-engine",
        title: "Check engine diagnostics",
        category: "faq",
        sourceLabel: "Services FAQ",
        sourceUrl: "https://orlandoautorepair.com/automotive-repair-service-orlando-fl/",
        tags: ["check engine", "warning light", "diagnostic", "error codes"],
        answer:
          "A check engine diagnostic includes reading error codes, identifying the underlying issue, and recommending a repair plan.",
        text:
          "The services FAQ explains that diagnostics involve scanning codes, finding the real cause of the problem, and outlining repair next steps."
      },
      {
        id: "blog-no-start",
        title: "Car won't start article",
        category: "blog",
        sourceLabel: "Blog",
        sourceUrl:
          "https://orlandoautorepair.com/car-wont-start-no-crank-vs-crank-no-start-starter-fuel-sensors/",
        tags: ["car won't start", "no crank", "crank no start", "starter", "fuel", "sensor"],
        answer:
          "The blog explains that a no-start problem may fall into either no-crank or crank-no-start, and diagnosis depends on whether the engine turns over.",
        text:
          "A February 26, 2026 blog post discusses the difference between no-crank and crank-no-start problems and points to causes involving the starter system, fuel delivery, or sensors."
      },
      {
        id: "blog-battery",
        title: "Battery dying overnight article",
        category: "blog",
        sourceLabel: "Blog",
        sourceUrl:
          "https://orlandoautorepair.com/battery-keeps-dying-overnight-parasitic-draw-testing-and-the-usual-culprits/",
        tags: ["battery", "overnight", "parasitic draw", "electrical drain", "click"],
        answer:
          "An overnight battery drain can be caused by a parasitic draw and may need proper electrical testing to find the source.",
        text:
          "A February 3, 2026 blog post explains that a battery dying overnight does not always mean the battery itself is bad and may indicate an electrical drain while the vehicle is off."
      }
    ]
  };
});
