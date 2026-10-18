/* Seed inventory for the house. Source: the home survey and the owner's answers on 2026-10-18.
 *
 * Fields: id, cat, name, qty, loc (location), make, model, serial,
 *   inst  install or manufacture date as YYYY, YYYY-MM or YYYY-MM-DD ('' if unknown),
 *   dk    'i' = date is the install date, 'm' = date is the manufacture date,
 *   life  expected life in years for planning (typical range, editable; null = not applicable),
 *   warr  warranty end date, vendor, svc (last service date), photo (link to label photo),
 *   tasks linked maintenance register IDs, notes,
 *   flag  an open question; shows "To confirm" until marked confirmed,
 *   need  fields that count as "details missing" (default: make, model, inst).
 * Blank means not yet known. Nothing here is guessed: gaps are left blank and flagged. */
(function (root) {
  'use strict';

  var CATS = [
    'Heating', 'Cooling', 'Hot water', 'Chimneys and fireplaces', 'Kitchen appliances', 'Laundry',
    'Electrical and safety', 'Plumbing and water', 'Garage and doors', 'Roof, envelope and exterior',
    'Smart home and network', 'Site and grounds', 'Outdoor equipment'
  ];

  var ITEMS = [
    /* ---- Heating ---- */
    { id:'HT01', cat:'Heating', name:'Oil boiler 1', qty:1, loc:'Basement', make:'', model:'', serial:'', inst:'', dk:'i', life:25, vendor:'JJ Donovan & Sons', tasks:['S02','S03','S04'],
      notes:'Feeds the air handlers. Vents through the right-hand chimney as seen from the front door. Serviced annually.',
      flag:'Make, model and age unknown. Read the data plate on each boiler, or ask JJ Donovan.' },
    { id:'HT02', cat:'Heating', name:'Oil boiler 2', qty:1, loc:'Basement', make:'', model:'', serial:'', inst:'', dk:'i', life:25, vendor:'JJ Donovan & Sons', tasks:['S02','S03','S04'],
      notes:'Feeds the air handlers. Serviced annually.',
      flag:'Make, model and age unknown. Confirm which zones each boiler serves.' },
    { id:'HT03', cat:'Heating', name:'Oil tank 1', qty:1, loc:'Basement', make:'', model:'', serial:'', inst:'', dk:'i', life:25, vendor:'JJ Donovan & Sons', tasks:['S05'],
      notes:'Inspected annually; no leaks or rust reported. Oil is auto-delivered.',
      flag:'Capacity, age and whether it has a vent alarm are unknown. Read the tank label.' },
    { id:'HT04', cat:'Heating', name:'Oil tank 2', qty:1, loc:'Basement', make:'', model:'', serial:'', inst:'', dk:'i', life:25, vendor:'JJ Donovan & Sons', tasks:['S05'],
      notes:'Inspected annually; no leaks or rust reported.',
      flag:'Capacity, age and vent alarm status are unknown.' },
    { id:'HT05', cat:'Heating', name:'Air handlers', qty:3, loc:'Basement', make:'', model:'BVA20 ECM', serial:'', inst:'2022', dk:'i', life:20, vendor:'', tasks:['W14','A04'],
      notes:'Installed 2022. Paired with the 3 Bosch heat pumps. Fed by the boilers.',
      flag:'Confirm the manufacturer from the label.', need:['make','model','inst'] },
    { id:'HT06', cat:'Heating', name:'Bosch heat pumps', qty:3, loc:'Basement', make:'Bosch', model:'', serial:'', inst:'2022', dk:'i', life:15, vendor:'', tasks:['A07','A04'],
      notes:'Installed 2022, paired with the 3 BVA20 ECM air handlers.',
      flag:'Model numbers, installer and warranty status are unknown.' },

    /* ---- Cooling ---- */
    { id:'CL01', cat:'Cooling', name:'Attic air conditioner (newer)', qty:1, loc:'Attic', make:'Mitsubishi', model:'', serial:'', inst:'2026', dk:'i', life:15, vendor:'', tasks:['A08','W09','W07'],
      notes:'Installed new in 2026.', flag:'Model, installer and warranty registration are unknown.' },
    { id:'CL02', cat:'Cooling', name:'Attic air conditioner (older)', qty:1, loc:'Attic', make:'', model:'', serial:'', inst:'2000', dk:'i', life:15, vendor:'', tasks:['A09','W09','W07'],
      notes:'About 2000. Still working but near the end of its life. May use R-22 refrigerant, which is no longer produced.',
      flag:'Make, model and exact age unknown. Read the data plate.' },

    /* ---- Hot water ---- */
    { id:'HW01', cat:'Hot water', name:'Indirect water heater', qty:1, loc:'', make:'Therma-Flow', model:'TF 115', serial:'', inst:'2002-05', dk:'m', life:25, vendor:'JJ Donovan & Sons', tasks:['W11','W15'],
      notes:'115-gallon stainless indirect tank heated by the boiler. Manufactured May 2002.',
      flag:'Location and serial number not recorded. The serial number gives the exact date and the warranty status.', need:['serial'] },

    /* ---- Chimneys and fireplaces ---- */
    { id:'CH01', cat:'Chimneys and fireplaces', name:'Boiler chimney', qty:1, loc:'Right-hand side facing the front door', make:'', model:'', serial:'', inst:'', dk:'i', life:null, vendor:'', tasks:['S01','S02','A16'],
      notes:'Brick. The boilers vent through it. Liner type unknown.',
      flag:'Liner type (stainless, clay or none) unknown until the Level 2 inspection.', need:[] },
    { id:'CH02', cat:'Chimneys and fireplaces', name:'Fireplaces and flues', qty:7, loc:'', make:'', model:'', serial:'', inst:'', dk:'i', life:null, vendor:'', tasks:['S01','S06','W03','A16'],
      notes:'None functional. Uncapped, mortar crumbled on flues and dampers. Candles only, 1 to 2 days a year.',
      flag:'Number of separate chimneys and which flues are shared is unknown.', need:[] },

    /* ---- Kitchen appliances (all electric; no gas or propane) ---- */
    { id:'KT01', cat:'Kitchen appliances', name:'Wall ovens', qty:2, loc:'', make:'Dacor', model:'CPS130R', serial:'', inst:'2008', dk:'m', life:15, vendor:'', tasks:[],
      notes:'Electric. Manufactured 2008.', flag:'', need:['serial'] },
    { id:'KT02', cat:'Kitchen appliances', name:'Range', qty:1, loc:'', make:'Viking', model:'RVEC3456BSB00', serial:'', inst:'2023', dk:'m', life:15, vendor:'', tasks:[],
      notes:'Electric. Manufactured 2023.', flag:'', need:['serial'] },
    { id:'KT03', cat:'Kitchen appliances', name:'Microwave', qty:1, loc:'', make:'GE', model:'JEB1050WV 001', serial:'', inst:'1997-07', dk:'m', life:10, vendor:'', tasks:[],
      notes:'Manufactured July 1997.', flag:'', need:['serial'] },
    { id:'KT04', cat:'Kitchen appliances', name:'Dishwashers (double drawer)', qty:2, loc:'', make:'Fisher & Paykel', model:'DD24DCTW6V2', serial:'DAX766186', inst:'', dk:'m', life:10, vendor:'', tasks:[],
      notes:'Two double-drawer units. Serial DAX766186 is for one of them. Manufacture date is not printed on the label.',
      flag:'Record the serial number of the second unit.' },
    { id:'KT05', cat:'Kitchen appliances', name:'Refrigerators', qty:null, loc:'', make:'', model:'', serial:'', inst:'', dk:'m', life:15, vendor:'', tasks:[],
      notes:'', flag:'Add the make, model, serial and date for each refrigerator unit (set the quantity above). You can add a separate line for each unit if the details differ.' },

    /* ---- Laundry ---- */
    { id:'LD01', cat:'Laundry', name:'Dryer', qty:1, loc:'', make:'LG', model:'', serial:'', inst:'', dk:'i', life:13, vendor:'Home Depot', tasks:['S09'],
      notes:'7.4 cu ft vented electric stackable, black steel, TurboSteam, Sensor Dry. Smart-enabled.',
      flag:'Model number, serial number, purchase date and vent route unknown. The label is inside the door.' },
    { id:'LD02', cat:'Laundry', name:'Washer', qty:1, loc:'', make:'LG', model:'', serial:'', inst:'', dk:'i', life:11, vendor:'Home Depot', tasks:[],
      notes:'4.5 cu ft stackable front-load, black steel, steam, TurboWash360. Smart-enabled.',
      flag:'Model number, serial number and purchase date unknown. The label is inside the door.' },

    /* ---- Electrical and safety ---- */
    { id:'EL01', cat:'Electrical and safety', name:'Electrical panels', qty:3, loc:'', make:'', model:'', serial:'', inst:'', dk:'i', life:null, vendor:'', tasks:['S10','S11'],
      notes:'Breaker panels. Major upgrade in 2021; further electrical work in 2026. No permits pulled for either. No knob-and-tube, cloth-sheathed or aluminum wiring reported.',
      flag:'Brand, amperage and what each panel feeds are unknown. Photograph each label.', need:['make','model'] },
    { id:'EL02', cat:'Electrical and safety', name:'Smoke and CO alarms', qty:15, loc:'Every room and hallway', make:'', model:'', serial:'', inst:'2026', dk:'i', life:10, vendor:'', tasks:['S07'],
      notes:'Hardwired and interconnected. About 15; installed 2026.',
      flag:'Exact count, brand and model. Replacement date is printed on the back of each alarm.' },
    { id:'EL03', cat:'Electrical and safety', name:'Fire extinguishers', qty:2, loc:'Kitchen; upstairs utility closet', make:'', model:'', serial:'', inst:'', dk:'m', life:12, vendor:'', tasks:['S08'],
      notes:'One on each floor.', flag:'Type, size and the manufacture or expiry date on each.' },
    { id:'EL04', cat:'Electrical and safety', name:'GFCI outlets', qty:null, loc:'', make:'', model:'', serial:'', inst:'', dk:'i', life:null, vendor:'', tasks:['S12'],
      notes:'In place. No flickering, buzzing or warm outlets reported.', flag:'', need:[] },

    /* ---- Plumbing and water ---- */
    { id:'PL01', cat:'Plumbing and water', name:'Well pump', qty:1, loc:'Basement', make:'', model:'', serial:'', inst:'', dk:'i', life:15, vendor:'', tasks:['W10','S17','S18'],
      notes:'Feeds the exterior spigots and irrigation only.', flag:'Make, model and age unknown.' },
    { id:'PL02', cat:'Plumbing and water', name:'Well pressure tank', qty:1, loc:'Basement', make:'', model:'', serial:'', inst:'', dk:'i', life:15, vendor:'', tasks:['W10'],
      notes:'', flag:'Make, model and age unknown.' },
    { id:'PL03', cat:'Plumbing and water', name:'Water filters', qty:2, loc:'On the main water line', make:'', model:'', serial:'', inst:'', dk:'i', life:null, vendor:'', tasks:['W16'],
      notes:'Two filters right off the main.',
      flag:'Filter type, cartridge model and how often they are changed unknown.', need:['make','model'] },
    { id:'PL04', cat:'Plumbing and water', name:'Main water shutoff', qty:1, loc:'', make:'', model:'', serial:'', inst:'', dk:'i', life:null, vendor:'', tasks:['W12'],
      notes:'Municipal water supplies the house.', flag:'Location and valve type unknown.', need:[] },
    { id:'PL05', cat:'Plumbing and water', name:'Frost-proof spigots', qty:3, loc:'Exterior', make:'', model:'', serial:'', inst:'2026', dk:'i', life:null, vendor:'', tasks:['W01'],
      notes:'Installed 2026. On well water.', flag:'', need:[] },
    { id:'PL06', cat:'Plumbing and water', name:'Irrigation system', qty:1, loc:'Yard', make:'', model:'', serial:'', inst:'', dk:'i', life:null, vendor:'', tasks:['W01','C02','W06'],
      notes:'Supplied by the well only, with no municipal connection.',
      flag:'Controller make and model, number of zones, installer, and whether a backflow preventer is installed.', need:['make','model','inst'] },
    { id:'PL07', cat:'Plumbing and water', name:'Supply and drain piping', qty:null, loc:'', make:'', model:'', serial:'', inst:'', dk:'i', life:null, vendor:'', tasks:[],
      notes:'Supply piping is mostly copper. Municipal sewer; no septic system.',
      flag:'Drain pipe material and the material of the water service line from the street (lead service lines matter with a toddler in the house).', need:[] },

    /* ---- Garage and doors ---- */
    { id:'GA01', cat:'Garage and doors', name:'Garage doors', qty:2, loc:'Garage (2001 addition)', make:'', model:'', serial:'', inst:'', dk:'i', life:25, vendor:'', tasks:[],
      notes:'', flag:'Make, model and age unknown.' },
    { id:'GA02', cat:'Garage and doors', name:'Garage door openers', qty:2, loc:'Garage', make:'', model:'', serial:'', inst:'', dk:'i', life:12, vendor:'', tasks:[],
      notes:'Controlled from a mobile app.', flag:'Brand, model and age unknown (the app name usually shows the brand).' },

    /* ---- Roof, envelope and exterior ---- */
    { id:'EV01', cat:'Roof, envelope and exterior', name:'Roof', qty:1, loc:'', make:'', model:'', serial:'', inst:'2026', dk:'i', life:25, vendor:'Duval Roofing', tasks:['A01','W04','W05','A14'],
      notes:'Asphalt shingles with water shield underneath. No ridge vent and no snow guards.',
      flag:'Shingle brand and line, manufacturer warranty and registration status, and the contractor workmanship warranty.', need:['make','model'] },
    { id:'EV02', cat:'Roof, envelope and exterior', name:'Spray foam insulation', qty:1, loc:'Attic roof deck', make:'', model:'', serial:'', inst:'2026', dk:'i', life:null, vendor:'RPD Insulation LLC', tasks:['A03','S06'],
      notes:'Open and closed cell on the roof deck. The foam has a break point around the chimneys.',
      flag:'Foam product, spec sheet and warranty.', need:['make'] },
    { id:'EV03', cat:'Roof, envelope and exterior', name:'Windows', qty:35, loc:'Whole house', make:'Andersen', model:'', serial:'', inst:'2025', dk:'i', life:30, vendor:'', tasks:['A02'],
      notes:'About 35 replacement windows installed 2025. No storm windows.',
      flag:'Product series, exact count and warranty paperwork.', need:['model'] },
    { id:'EV04', cat:'Roof, envelope and exterior', name:'Exterior paint', qty:1, loc:'Wood siding and trim', make:'', model:'', serial:'', inst:'2024', dk:'i', life:10, vendor:'', tasks:['C01','S13','S14'],
      notes:'White. Repainted 2024 by a painter who was not RRP-certified; no lead test was done.',
      flag:'Painter, paint product and color code.', need:['make'] },
    { id:'EV05', cat:'Roof, envelope and exterior', name:'Gutters and downspouts', qty:1, loc:'', make:'', model:'', serial:'', inst:'', dk:'i', life:25, vendor:'', tasks:['W02'],
      notes:'Aluminum.', flag:'Age, whether gutter guards are fitted, and where the downspouts discharge.', need:['inst'] },

    /* ---- Smart home and network ---- */
    { id:'SM01', cat:'Smart home and network', name:'Video doorbell', qty:1, loc:'Front door', make:'Ring', model:'', serial:'', inst:'', dk:'i', life:8, vendor:'', tasks:[],
      notes:'', flag:'Model and age unknown.' },
    { id:'SM02', cat:'Smart home and network', name:'Thermostats', qty:null, loc:'', make:'ecobee and Nest', model:'', serial:'', inst:'', dk:'i', life:10, vendor:'', tasks:[],
      notes:'A mix of ecobee and Nest.', flag:'How many of each, which zone each controls, and models.' },
    { id:'SM03', cat:'Smart home and network', name:'Mesh Wi-Fi', qty:null, loc:'', make:'eero', model:'', serial:'', inst:'', dk:'i', life:6, vendor:'', tasks:[],
      notes:'', flag:'Model and number of units.' },
    { id:'SM04', cat:'Smart home and network', name:'Alexa devices', qty:null, loc:'Throughout the house', make:'Amazon', model:'', serial:'', inst:'', dk:'i', life:null, vendor:'', tasks:[],
      notes:'', flag:'Number and models.', need:[] },

    /* ---- Site and grounds ---- */
    { id:'ST01', cat:'Site and grounds', name:'Asphalt driveway', qty:1, loc:'', make:'', model:'', serial:'', inst:'', dk:'i', life:20, vendor:'', tasks:['C04'],
      notes:'', flag:'Age and last sealcoat unknown.', need:['inst'] },
    { id:'ST02', cat:'Site and grounds', name:'Brick walkway', qty:1, loc:'', make:'', model:'', serial:'', inst:'', dk:'i', life:null, vendor:'', tasks:['C03','A14'],
      notes:'', flag:'', need:[] },
    { id:'ST03', cat:'Site and grounds', name:'Stone retaining walls', qty:null, loc:'', make:'', model:'', serial:'', inst:'', dk:'i', life:null, vendor:'', tasks:['C03'],
      notes:'', flag:'', need:[] },
    { id:'ST04', cat:'Site and grounds', name:'Shed', qty:1, loc:'', make:'', model:'', serial:'', inst:'', dk:'i', life:null, vendor:'', tasks:[],
      notes:'The door has been repaired.', flag:'Size, construction and age unknown.', need:['inst'] },
    { id:'ST05', cat:'Site and grounds', name:'Specimen trees', qty:null, loc:'Yard', make:'', model:'', serial:'', inst:'', dk:'i', life:null, vendor:'', tasks:['A10'],
      notes:'Large maple (co-dominant leader, tar spot), Japanese maple, blue spruce, Japanese smoke tree.',
      flag:'Other trees near the house, roof or power lines.', need:[] },

    /* ---- Outdoor equipment ---- */
    { id:'EQ01', cat:'Outdoor equipment', name:'Lawn mower', qty:1, loc:'', make:'', model:'', serial:'', inst:'', dk:'i', life:10, vendor:'', tasks:['C07'],
      notes:'', flag:'Details to come: make, model, fuel or battery, year.' },
    { id:'EQ02', cat:'Outdoor equipment', name:'Snowblower', qty:1, loc:'', make:'', model:'', serial:'', inst:'', dk:'i', life:12, vendor:'', tasks:['C06'],
      notes:'', flag:'Details to come: make, model, fuel or battery, year.' }
  ];

  /* Confirmed not present, so the absence is on record. */
  var ABSENT = [
    'Gas or propane service (the house is all electric apart from oil heat)',
    'Generator or transfer switch',
    'Whole-house surge protector',
    'Septic system (municipal sewer)',
    'Sump pump',
    'Dehumidifier',
    'Chest freezer',
    'Storm windows',
    'Chimney caps'
  ];

  root.HM_INV_DATA = { cats: CATS, items: ITEMS, absent: ABSENT };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.HM_INV_DATA;
})(typeof window !== 'undefined' ? window : globalThis);
