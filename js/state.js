/* ══════════════════════════════════════════
   VoltEarth — State & Data Constants (state.js)
   Global state, location data, fake user seeds
══════════════════════════════════════════ */

// STATE
// ══════════════════════════════════════════
let user = null;
let gpsData = { lat: null, lng: null, city: '', state: '', country: 'India', accuracy: null, method: '' };
let selEnergy = 'solar';
let dlTf = 'weekly', dlType = 'report';
let allRptRows = [], allActRows = [];
let lastResult = null;
let voiceOpen = false, curTf = 'day';
let mC=null,piC=null,sC=null,wC=null,rC=null,resChart=null;
let selectedLocationType = null; // 'country' | 'state' | 'district' | 'exact'

// ── Location data including Tamil Nadu ──
const LOC_DATA = {
  IN:{
    states:['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal'],
    districts:{
      'Andhra Pradesh':['Visakhapatnam','Vijayawada','Guntur','Nellore','Kurnool','Tirupati'],
      'Assam':['Guwahati','Dibrugarh','Silchar','Jorhat'],
      'Bihar':['Patna','Gaya','Bhagalpur','Muzaffarpur'],
      'Chhattisgarh':['Raipur','Bilaspur','Durg','Korba'],
      'Delhi':['Central Delhi','East Delhi','New Delhi','North Delhi','South Delhi','West Delhi'],
      'Goa':['North Goa','South Goa'],
      'Gujarat':['Ahmedabad','Surat','Vadodara','Rajkot','Gandhinagar','Bhavnagar'],
      'Haryana':['Gurugram','Faridabad','Hisar','Rohtak','Panipat'],
      'Himachal Pradesh':['Shimla','Dharamsala','Mandi','Solan'],
      'Jharkhand':['Ranchi','Jamshedpur','Dhanbad','Bokaro'],
      'Karnataka':['Bengaluru','Mysuru','Hubli','Mangaluru','Belagavi','Kalaburagi'],
      'Kerala':['Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam'],
      'Madhya Pradesh':['Bhopal','Indore','Gwalior','Jabalpur','Ujjain'],
      'Maharashtra':['Mumbai','Pune','Nashik','Nagpur','Aurangabad','Kolhapur','Thane','Solapur'],
      'Odisha':['Bhubaneswar','Cuttack','Rourkela','Berhampur'],
      'Punjab':['Ludhiana','Amritsar','Chandigarh','Jalandhar','Patiala'],
      'Rajasthan':['Jaipur','Jodhpur','Udaipur','Kota','Bikaner','Ajmer'],
      'Tamil Nadu':['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Vellore','Erode','Thoothukudi','Kancheepuram','Dindigul','Thanjavur','Tirupur','Cuddalore','Ramanathapuram'],
      'Telangana':['Hyderabad','Warangal','Karimnagar','Nizamabad','Khammam'],
      'Uttar Pradesh':['Lucknow','Kanpur','Varanasi','Agra','Prayagraj','Meerut','Noida'],
      'Uttarakhand':['Dehradun','Haridwar','Roorkee','Rishikesh'],
      'West Bengal':['Kolkata','Asansol','Siliguri','Durgapur','Howrah']
    }
  },
  US:{
    states:['California','Texas','Arizona','Florida','New York','Nevada'],
    districts:{
      'California':['Los Angeles','San Francisco','San Diego','Sacramento','San Jose'],
      'Texas':['Houston','Austin','Dallas','San Antonio','Fort Worth'],
      'Arizona':['Phoenix','Tucson','Scottsdale','Tempe'],
      'Florida':['Miami','Orlando','Tampa','Jacksonville'],
      'New York':['New York City','Buffalo','Rochester','Albany'],
      'Nevada':['Las Vegas','Reno','Henderson']
    }
  },
  AU:{
    states:['New South Wales','Queensland','Western Australia','Victoria','South Australia'],
    districts:{
      'New South Wales':['Sydney','Newcastle','Wollongong','Central Coast'],
      'Queensland':['Brisbane','Gold Coast','Sunshine Coast','Cairns'],
      'Western Australia':['Perth','Fremantle','Mandurah'],
      'Victoria':['Melbourne','Geelong','Ballarat'],
      'South Australia':['Adelaide','Mount Gambier']
    }
  },
  DE:{
    states:['Bavaria','Berlin','Hamburg','North Rhine-Westphalia','Baden-Württemberg'],
    districts:{
      'Bavaria':['Munich','Nuremberg','Augsburg'],
      'Berlin':['Mitte','Charlottenburg','Prenzlauer Berg'],
      'Hamburg':['Hamburg City'],
      'North Rhine-Westphalia':['Cologne','Düsseldorf','Dortmund','Essen'],
      'Baden-Württemberg':['Stuttgart','Mannheim','Karlsruhe']
    }
  }
};

// State lat/lng center coords (used for GPS display in Manual mode - NO °N/°E shown)
const STATE_COORDS = {
  'Maharashtra':{lat:19.7515,lng:75.7139},
  'Gujarat':{lat:22.2587,lng:71.1924},
  'Rajasthan':{lat:27.0238,lng:74.2179},
  'Karnataka':{lat:15.3173,lng:75.7139},
  'Tamil Nadu':{lat:11.1271,lng:78.6569},
  'Andhra Pradesh':{lat:15.9129,lng:79.7400},
  'Telangana':{lat:18.1124,lng:79.0193},
  'Delhi':{lat:28.7041,lng:77.1025},
  'Kerala':{lat:10.8505,lng:76.2711},
  'Uttar Pradesh':{lat:26.8467,lng:80.9462},
  'Madhya Pradesh':{lat:22.9734,lng:78.6569},
  'California':{lat:36.7783,lng:-119.4179},
  'Texas':{lat:31.9686,lng:-99.9018},
  'New South Wales':{lat:-33.8688,lng:151.2093},
  'Bavaria':{lat:48.7904,lng:11.4979}
};

const FAKE_USERS = [
  {name:'Priya Sharma',  email:'p.sharma@solar.in',    device:'Chrome 124 / Windows 11', ip:'103.21.58.12',  colors:['#3b82f6','#8b5cf6']},
  {name:'Arjun Mehta',   email:'a.mehta@windtech.co',  device:'Safari 17 / macOS Sonoma', ip:'49.36.102.44', colors:['#10b981','#3b82f6']},
  {name:'Sneha Patil',   email:'s.patil@gov.in',       device:'Firefox 125 / Ubuntu',    ip:'117.55.9.201',  colors:['#f59e0b','#ef4444']},
  {name:'Rahul Desai',   email:'r.desai@greenco.io',   device:'Chrome 124 / Android 14', ip:'182.64.77.33',  colors:['#8b5cf6','#ec4899']},
  {name:'Kavya Nair',    email:'k.nair@pvglobal.in',   device:'Edge 124 / Windows 10',   ip:'49.204.56.18',  colors:['#06b6d4','#10b981']},
];
const ACTIONS = [
  {a:'Login',      d:'Dashboard',            cat:'auth'},
  {a:'View Report',d:'Monthly Report',       cat:'view'},
  {a:'Download',   d:'Weekly CSV',           cat:'download'},
  {a:'Search',     d:'Solar irradiance pune', cat:'search'},
  {a:'Generate',   d:'Solar Analysis – Pune', cat:'generate'},
  {a:'View Report',d:'Yearly Report',        cat:'view'},
  {a:'Download',   d:'Monthly CSV',          cat:'download'},
  {a:'Search',     d:'Wind speed nagpur',    cat:'search'},
  {a:'View Page',  d:'Dashboard',            cat:'view'},
  {a:'Download',   d:'Yearly CSV',           cat:'download'},
  {a:'Search',     d:'Energy report Jaipur', cat:'search'},
  {a:'Generate',   d:'Wind Analysis – Pune', cat:'generate'},
];