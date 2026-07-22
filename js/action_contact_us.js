// Credify Capital - Contact Form City Handler
// This provides the add_contact_us_city function referenced in contact-us.html

var cityData = {
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Pitampura", "Janakpuri"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Khammam"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Ghaziabad", "Noida"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol"],
  "Haryana": ["Gurugram", "Faridabad", "Ambala", "Panipat"],
  "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela"],
  "Assam": ["Guwahati", "Silchar", "Jorhat"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Nainital"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama"]
};

function add_contact_us_city() {
  var stateSelect = document.getElementById("State");
  var citySelect = document.getElementById("City");

  if (!stateSelect || !citySelect) return;

  // Populate state dropdown if empty
  if (stateSelect.options.length <= 1) {
    Object.keys(cityData).forEach(function(state) {
      var option = document.createElement("option");
      option.value = state;
      option.text = state;
      stateSelect.appendChild(option);
    });
  }

  // Listen for state changes
  stateSelect.addEventListener("change", function() {
    // Clear existing city options
    while (citySelect.options.length > 1) {
      citySelect.remove(1);
    }

    var selectedState = stateSelect.value;
    if (selectedState && cityData[selectedState]) {
      cityData[selectedState].forEach(function(city) {
        var option = document.createElement("option");
        option.value = city;
        option.text = city;
        citySelect.appendChild(option);
      });
    }
  });
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
  add_contact_us_city();
});
