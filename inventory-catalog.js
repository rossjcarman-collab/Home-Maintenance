/* Picker catalog for "Add an item" on the Home inventory tab.
 *
 * Each type gives the add form its defaults: category, typical planning life in years, whether the
 * date on the label is usually an install date ('i') or a manufacture date ('m'), maintenance tasks
 * to link (register IDs), and the popular makes. `models` lists common product lines for a make.
 * These are lines or series, not full part numbers. Many appliances have several variants, so the
 * full model number should always be copied from the data plate. Leave a model blank or type your own.
 * Life values are typical planning ranges, not predictions, and can be edited per item. */
(function (root) {
  'use strict';

  var APPL = ['GE', 'Whirlpool', 'Samsung', 'LG', 'Frigidaire', 'Bosch', 'KitchenAid', 'Maytag', 'Electrolux', 'Miele', 'Fisher & Paykel'];
  var PREM = ['Viking', 'Wolf', 'Thermador', 'Dacor', 'Sub-Zero', 'JennAir', 'Café'];

  var TYPES = [
    /* Kitchen appliances */
    { k: 'fridge', label: 'Refrigerator', cat: 'Kitchen appliances', life: 13, dk: 'm', tasks: [], need: ['make', 'model', 'inst'],
      makes: ['GE', 'Whirlpool', 'Samsung', 'LG', 'Frigidaire', 'Bosch', 'KitchenAid', 'Maytag', 'Sub-Zero', 'Thermador', 'Viking', 'Fisher & Paykel', 'Miele', 'JennAir', 'Café'] },
    { k: 'freezer', label: 'Freezer (chest or upright)', cat: 'Kitchen appliances', life: 15, dk: 'm', tasks: [], makes: ['Frigidaire', 'GE', 'Whirlpool', 'Kenmore', 'Maytag', 'Danby'] },
    { k: 'range', label: 'Range or oven', cat: 'Kitchen appliances', life: 15, dk: 'm', tasks: [], makes: APPL.concat(PREM) },
    { k: 'cooktop', label: 'Cooktop', cat: 'Kitchen appliances', life: 15, dk: 'm', tasks: [], makes: APPL.concat(PREM) },
    { k: 'micro', label: 'Microwave', cat: 'Kitchen appliances', life: 9, dk: 'm', tasks: [], makes: ['GE', 'Whirlpool', 'Samsung', 'LG', 'Panasonic', 'Sharp', 'KitchenAid', 'Frigidaire', 'Bosch', 'Café'] },
    { k: 'dish', label: 'Dishwasher', cat: 'Kitchen appliances', life: 10, dk: 'm', tasks: [],
      makes: ['Bosch', 'Miele', 'KitchenAid', 'Whirlpool', 'GE', 'Samsung', 'LG', 'Maytag', 'Fisher & Paykel', 'Frigidaire', 'Thermador', 'Asko'],
      models: { 'Bosch': ['100 Series', '300 Series', '500 Series', '800 Series', 'Benchmark'] } },
    { k: 'hood', label: 'Range hood or vent', cat: 'Kitchen appliances', life: 15, dk: 'i', tasks: [], makes: ['Broan', 'Vent-A-Hood', 'Zephyr', 'Faber', 'GE', 'Whirlpool', 'Thermador', 'Viking', 'Wolf'] },
    { k: 'disposal', label: 'Garbage disposal', cat: 'Kitchen appliances', life: 12, dk: 'i', tasks: [], makes: ['InSinkErator', 'Waste King', 'Moen', 'GE'] },
    { k: 'bevfridge', label: 'Wine or beverage fridge', cat: 'Kitchen appliances', life: 10, dk: 'm', tasks: [], makes: ['Sub-Zero', 'U-Line', 'Avanti', 'EdgeStar', 'GE', 'Whirlpool', 'KitchenAid', 'Danby'] },

    /* Laundry */
    { k: 'washer', label: 'Washer', cat: 'Laundry', life: 11, dk: 'm', tasks: [], makes: ['LG', 'Samsung', 'Whirlpool', 'GE', 'Maytag', 'Electrolux', 'Bosch', 'Miele', 'Speed Queen', 'Frigidaire'] },
    { k: 'dryer', label: 'Dryer', cat: 'Laundry', life: 13, dk: 'm', tasks: ['S09'], makes: ['LG', 'Samsung', 'Whirlpool', 'GE', 'Maytag', 'Electrolux', 'Bosch', 'Miele', 'Speed Queen', 'Frigidaire'] },

    /* Heating */
    { k: 'boiler', label: 'Oil boiler', cat: 'Heating', life: 25, dk: 'i', tasks: ['S02', 'S03', 'S04'], makes: ['Weil-McLain', 'Burnham', 'Buderus', 'Peerless', 'Utica', 'Slant/Fin', 'Thermo Pride', 'Smith', 'Crown'] },
    { k: 'oiltank', label: 'Oil tank', cat: 'Heating', life: 25, dk: 'm', tasks: ['S05'], makes: ['Granby', 'Roth', 'Ward', 'Highland Tank', 'Modern Welding', 'Tuthill'] },
    { k: 'furnace', label: 'Furnace', cat: 'Heating', life: 20, dk: 'i', tasks: [], makes: ['Carrier', 'Lennox', 'Trane', 'Rheem', 'Goodman', 'York', 'American Standard', 'Bryant', 'Armstrong', 'Thermo Pride'] },
    { k: 'airhandler', label: 'Air handler', cat: 'Heating', life: 20, dk: 'i', tasks: ['W14'], makes: ['Bosch', 'Carrier', 'Trane', 'Lennox', 'Rheem', 'Goodman', 'Mitsubishi', 'Fujitsu', 'Daikin', 'Unico'] },
    { k: 'heatpump', label: 'Heat pump', cat: 'Heating', life: 15, dk: 'i', tasks: ['A07'],
      makes: ['Mitsubishi', 'Bosch', 'Daikin', 'Fujitsu', 'Carrier', 'Trane', 'Lennox', 'Rheem', 'Goodman', 'LG', 'Gree', 'Samsung'],
      models: { 'Mitsubishi': ['M-Series', 'P-Series', 'Hyper-Heat (H2i)'], 'Carrier': ['Infinity', 'Performance', 'Comfort'], 'Trane': ['XV', 'XR'], 'Daikin': ['Fit', 'Aurora', 'Atmosphere'] } },
    { k: 'space', label: 'Space or radiant heater', cat: 'Heating', life: 15, dk: 'i', tasks: [], makes: ['Dimplex', 'Cadet', 'Fahrenheat', 'Stiebel Eltron', 'De’Longhi'] },

    /* Cooling */
    { k: 'ac', label: 'Central air conditioner', cat: 'Cooling', life: 15, dk: 'i', tasks: ['A08'], makes: ['Carrier', 'Trane', 'Lennox', 'Rheem', 'Goodman', 'York', 'Bryant', 'American Standard', 'Mitsubishi', 'Daikin', 'Fujitsu'] },
    { k: 'minisplit', label: 'Ductless mini-split', cat: 'Cooling', life: 15, dk: 'i', tasks: [], makes: ['Mitsubishi', 'Daikin', 'Fujitsu', 'LG', 'Gree', 'Carrier', 'Midea', 'Samsung'] },
    { k: 'windowac', label: 'Window or portable AC', cat: 'Cooling', life: 10, dk: 'm', tasks: [], makes: ['Frigidaire', 'LG', 'GE', 'Midea', 'Friedrich', 'Haier', 'Whynter'] },
    { k: 'dehum', label: 'Dehumidifier', cat: 'Cooling', life: 8, dk: 'm', tasks: [], makes: ['Frigidaire', 'hOmeLabs', 'Honeywell', 'Aprilaire', 'AlorAir', 'Santa Fe', 'Midea', 'GE'] },
    { k: 'humid', label: 'Humidifier', cat: 'Cooling', life: 10, dk: 'i', tasks: [], makes: ['Aprilaire', 'Honeywell', 'Trane', 'Lennox', 'Carrier'] },

    /* Hot water and plumbing */
    { k: 'wh', label: 'Water heater (tank)', cat: 'Hot water', life: 12, dk: 'm', tasks: [],
      makes: ['Rheem', 'A. O. Smith', 'Bradford White', 'State', 'American', 'GE', 'Whirlpool', 'Therma-Flow'],
      models: { 'Rheem': ['Professional', 'Performance Platinum', 'Proterra (heat pump)'], 'A. O. Smith': ['ProLine', 'Signature', 'Voltex (heat pump)'], 'Bradford White': ['Defender Safety System', 'AeroTherm (heat pump)'] } },
    { k: 'tankless', label: 'Tankless water heater', cat: 'Hot water', life: 20, dk: 'i', tasks: [], makes: ['Rinnai', 'Navien', 'Rheem', 'Noritz', 'A. O. Smith', 'Bosch', 'Takagi', 'Stiebel Eltron'] },
    { k: 'indirect', label: 'Indirect water heater', cat: 'Hot water', life: 25, dk: 'm', tasks: [], makes: ['Therma-Flow', 'Amtrol', 'Triangle Tube', 'Burnham', 'Weil-McLain', 'Buderus', 'Heat-Flo', 'Superstor (Heat Transfer Products)'] },
    { k: 'softener', label: 'Water softener', cat: 'Plumbing and water', life: 12, dk: 'i', tasks: [], makes: ['Culligan', 'Kinetico', 'EcoWater', 'Morton', 'Whirlpool', 'Pentair', 'Fleck (valve)'] },
    { k: 'wfilter', label: 'Whole-house water filter', cat: 'Plumbing and water', life: null, dk: 'i', tasks: ['W16'], makes: ['Culligan', 'Pentair', '3M Aqua-Pure', 'Aquasana', 'Everpure', 'Clearly Filtered', 'SpringWell', 'Big Blue (housing)'], need: ['make', 'model'] },
    { k: 'sump', label: 'Sump pump', cat: 'Plumbing and water', life: 10, dk: 'i', tasks: [], makes: ['Zoeller', 'Wayne', 'Liberty', 'Superior Pump', 'Flotec', 'Basement Watchdog'], models: { 'Zoeller': ['M53', 'M98'] } },
    { k: 'wellpump', label: 'Well pump', cat: 'Plumbing and water', life: 15, dk: 'i', tasks: ['W10'], makes: ['Franklin Electric', 'Goulds', 'Grundfos', 'Red Lion', 'Flotec', 'Wayne'] },
    { k: 'ptank', label: 'Pressure tank', cat: 'Plumbing and water', life: 15, dk: 'i', tasks: ['W10'], makes: ['Amtrol', 'Well-X-Trol', 'Flexcon', 'Wayne', 'Goulds'] },
    { k: 'prv', label: 'Pressure-reducing valve or shutoff', cat: 'Plumbing and water', life: 20, dk: 'i', tasks: [], makes: ['Watts', 'Wilkins', 'Apollo', 'Zurn', 'Conbraco'] },
    { k: 'leaksys', label: 'Leak sensor or auto shutoff', cat: 'Plumbing and water', life: 8, dk: 'i', tasks: [], makes: ['Moen Flo', 'Phyn', 'YoLink', 'Govee', 'Ring', 'Honeywell', 'Flume'] },

    /* Electrical and safety */
    { k: 'smoke', label: 'Smoke or CO alarm', cat: 'Electrical and safety', life: 10, dk: 'm', tasks: ['S07'], makes: ['First Alert', 'Kidde', 'Google Nest', 'BRK', 'Universal Security', 'Ring', 'Siemens'], models: { 'Google Nest': ['Protect'], 'Kidde': ['Hardwired', 'Battery'] } },
    { k: 'extinguisher', label: 'Fire extinguisher', cat: 'Electrical and safety', life: 12, dk: 'm', tasks: ['S08'], makes: ['Kidde', 'First Alert', 'Amerex', 'Buckeye', 'Badger', 'Ansul'] },
    { k: 'panel', label: 'Electrical panel or subpanel', cat: 'Electrical and safety', life: null, dk: 'i', tasks: ['S10'], makes: ['Square D', 'Eaton / Cutler-Hammer', 'Siemens', 'GE', 'Murray', 'Federal Pacific', 'Zinsco', 'Challenger', 'Westinghouse'], need: ['make', 'model'] },
    { k: 'gen', label: 'Generator', cat: 'Electrical and safety', life: 20, dk: 'i', tasks: [], makes: ['Generac', 'Kohler', 'Cummins', 'Honda', 'Champion', 'Briggs & Stratton', 'Yamaha', 'Westinghouse', 'DuroMax'], models: { 'Generac': ['Guardian Series', 'PowerPact', 'iQ Series (portable)'], 'Honda': ['EU Series (portable)'] } },
    { k: 'surge', label: 'Whole-house surge protector', cat: 'Electrical and safety', life: 10, dk: 'i', tasks: [], makes: ['Square D', 'Eaton', 'Siemens', 'Leviton', 'Intermatic', 'Delta'] },
    { k: 'evc', label: 'EV charger', cat: 'Electrical and safety', life: 10, dk: 'i', tasks: [], makes: ['Tesla', 'ChargePoint', 'Emporia', 'JuiceBox', 'Wallbox', 'Grizzl-E', 'Siemens', 'Eaton'] },

    /* Garage and doors */
    { k: 'gdo', label: 'Garage door opener', cat: 'Garage and doors', life: 12, dk: 'i', tasks: [], makes: ['LiftMaster', 'Chamberlain', 'Genie', 'Craftsman', 'Overhead Door', 'Sommer'] },
    { k: 'gdoor', label: 'Garage door', cat: 'Garage and doors', life: 25, dk: 'i', tasks: [], makes: ['Clopay', 'Amarr', 'Wayne Dalton', 'Overhead Door', 'Haas', 'CHI', 'Carriage House'] },

    /* Smart home and network */
    { k: 'thermo', label: 'Thermostat', cat: 'Smart home and network', life: 10, dk: 'i', tasks: [], makes: ['ecobee', 'Google Nest', 'Honeywell', 'Emerson Sensi', 'Resideo', 'Carrier', 'Trane', 'Mysa'], models: { 'ecobee': ['Smart Thermostat Premium', 'Smart Thermostat Enhanced', 'Lite'], 'Google Nest': ['Learning Thermostat', 'Thermostat'], 'Honeywell': ['T6 Pro', 'T9'] } },
    { k: 'doorbell', label: 'Video doorbell or camera', cat: 'Smart home and network', life: 8, dk: 'i', tasks: [], makes: ['Ring', 'Google Nest', 'Arlo', 'Eufy', 'Wyze', 'Reolink', 'SimpliSafe'] },
    { k: 'wifi', label: 'Wi-Fi router or mesh', cat: 'Smart home and network', life: 6, dk: 'i', tasks: [], makes: ['eero', 'Netgear', 'TP-Link', 'Ubiquiti', 'Google Nest', 'ASUS', 'Linksys', 'Orbi (Netgear)'], models: { 'eero': ['Pro 6E', '6+', 'Max 7', 'Pro 7', 'Pro 6'] } },
    { k: 'alarm', label: 'Security system', cat: 'Smart home and network', life: 12, dk: 'i', tasks: [], makes: ['ADT', 'SimpliSafe', 'Vivint', 'Ring', 'Honeywell', 'DSC', 'Brinks'] },

    /* Outdoor equipment and site */
    { k: 'mower', label: 'Lawn mower', cat: 'Outdoor equipment', life: 10, dk: 'm', tasks: ['C07'], makes: ['Honda', 'Toro', 'John Deere', 'Husqvarna', 'Cub Cadet', 'EGO', 'Ariens', 'Craftsman', 'Troy-Bilt'], models: { 'Honda': ['HRX', 'HRN', 'HRR'], 'Toro': ['Recycler', 'TimeMaster', 'Personal Pace'], 'EGO': ['Power+ Select Cut'] } },
    { k: 'ridemower', label: 'Riding mower or tractor', cat: 'Outdoor equipment', life: 15, dk: 'm', tasks: ['C07'], makes: ['John Deere', 'Husqvarna', 'Cub Cadet', 'Toro', 'Kubota', 'Ariens', 'Craftsman', 'Troy-Bilt'] },
    { k: 'snowblower', label: 'Snowblower', cat: 'Outdoor equipment', life: 15, dk: 'm', tasks: ['C06'], makes: ['Ariens', 'Toro', 'Honda', 'Cub Cadet', 'EGO', 'Husqvarna', 'Troy-Bilt', 'Craftsman'], models: { 'Ariens': ['Deluxe', 'Platinum', 'Professional', 'Compact'], 'Toro': ['Power Max', 'Power Max HD', 'SnowMaster'], 'Honda': ['HSS Series'] } },
    { k: 'trimmer', label: 'Trimmer, blower or chainsaw', cat: 'Outdoor equipment', life: 8, dk: 'm', tasks: [], makes: ['Stihl', 'Husqvarna', 'EGO', 'Echo', 'DeWalt', 'Milwaukee', 'Makita', 'Ryobi', 'Greenworks'] },
    { k: 'pwasher', label: 'Pressure washer', cat: 'Outdoor equipment', life: 8, dk: 'm', tasks: [], makes: ['Simpson', 'Honda', 'Karcher', 'DeWalt', 'Generac', 'Ryobi', 'Sun Joe'] },
    { k: 'irrig', label: 'Irrigation controller', cat: 'Site and grounds', life: 12, dk: 'i', tasks: ['C02', 'W01'], makes: ['Rain Bird', 'Hunter', 'Rachio', 'Orbit', 'Toro', 'RainMachine'], models: { 'Rachio': ['3', '3e'] } },
    { k: 'pool', label: 'Pool, spa or pump', cat: 'Site and grounds', life: 10, dk: 'i', tasks: [], makes: ['Pentair', 'Hayward', 'Jandy', 'Sta-Rite', 'Intex'] }
  ];

  /* Common rooms and spots for the Location suggestions */
  var LOCATIONS = ['Kitchen', 'Basement', 'Attic', 'Laundry room', 'Garage', 'Upstairs utility closet', 'Mudroom', 'Pantry', 'Primary bedroom', 'Primary bathroom', 'Guest bathroom', 'Hallway', 'Living room', 'Dining room', 'Home office', 'Barn or shed', 'Outside'];

  var api = { types: TYPES, locations: LOCATIONS, byKey: function (k) { return TYPES.filter(function (t) { return t.k === k; })[0]; } };
  root.HM_INV_CATALOG = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
