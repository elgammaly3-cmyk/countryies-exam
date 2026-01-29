
const navItems = document.querySelectorAll('.nav-item');  // select any link in sidebar
const sections = document.querySelectorAll('.view');  // select any section in page
const globalCountry = document.getElementById("global-country");  // select global country ==> select country
const citySelect = document.getElementById("global-city"); // select city
const selectedDestination = document.getElementById("selected-destination"); // display selected destination
const globalSearchBtn = document.getElementById("global-search-btn");  // search button
const globalYear = document.getElementById("global-year"); // select year

// loop in navItems
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.getAttribute('data-view');  // get view name such as dashboard , holiday etc
        navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active'); // add active class

             sections.forEach(section => {
                section.classList.remove('active'); // remove active class in all section
                 if (section.id === `${targetView}-view`) {   // get id in any section 
                    section.classList.add('active');
                }
            });
            const pageTitle = document.getElementById('page-title');
            const Ptext = item.querySelector('span').textContent;
            if (pageTitle) pageTitle.textContent = Ptext;
    });
});

let bigData = []; 
let currentCountryData = null; 
// display available countries in the select
availableCountries();
async function availableCountries() {
    try {
        const response = await fetch('https://date.nager.at/api/v3/AvailableCountries');
        if (!response.ok) throw new Error('Failed to fetch countries');
        
        bigData = await response.json();
        bigData.sort((a, b) => a.name.localeCompare(b.name));

        globalCountry.innerHTML = '<option value="">Select Country</option>';
        bigData.forEach(country => {
            const option = document.createElement('option');
            option.value = country.countryCode;
            option.textContent = `${country.countryCode.toUpperCase()} - ${country.name}`;
            globalCountry.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading countries:", error);
    }
}
// function to start live clock
function startLiveClock() {
    const dateTimeElement = document.getElementById('current-datetime');

    // وظيفة التحديث
    const tick = () => {
        const now = new Date();

        // التنسيق الذي طلبته: Sat, Jan 25, 08:30 AM
        const options = {
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };

        dateTimeElement.textContent = now.toLocaleString('en-US', options);
    };

    // تشغيلها كل ثانية
    setInterval(tick, 1000);
    tick(); // تشغيل فوري أول مرة
}

// start live clock
window.addEventListener('DOMContentLoaded', startLiveClock);

globalCountry.addEventListener("change", (e) => {
    const countryCode = e.target.value;
    if (countryCode) {
        getCities(countryCode);
        // getCities(globalCountry.value);
    } else {
        selectedDestination.innerHTML = ''; 
    }
});



// get cities 
async function getCities(countryCode) {
    try {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        if (!response.ok) throw new Error('Country details not found');

        const data = await response.json();
        currentCountryData = data[0]; 

        // ubdate cities
        const cities = currentCountryData.capital || [];
        citySelect.innerHTML = '';
        
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = `${city} (Capital)`;
            citySelect.appendChild(option);
        });

        // call displayCountry
        displayCountry();

    } catch (error) {
        console.error("Error fetching cities:", error);
    }
}

// display selected country and city
function displayCountry() {
    if (!currentCountryData) return;

   // searh for country
    const countryInfo = bigData.find(c => c.countryCode === currentCountryData.cca2);

    selectedDestination.innerHTML = `
        <div class="selected-flag">
            <img id="selected-country-flag" src="${currentCountryData.flags.png}" alt="${currentCountryData.name.common}" width="50">
        </div>
        <div class="selected-info">
            <span class="selected-country-name">${countryInfo ? countryInfo.name : currentCountryData.name.common}</span>
            <span class="selected-city-name">• ${currentCountryData.capital ? currentCountryData.capital[0] : 'No Capital'}</span>
        </div>
        <button class="clear-selection-btn" id="clear-selection-btn" onclick="clearSelection()">
            <i class="fa-solid fa-xmark">X</i>
        </button>
    `;
}

//clear selection
function clearSelection() {
    globalCountry.value = "";
    citySelect.innerHTML = '<option value="">Select City</option>';
    selectedDestination.innerHTML = "";
    currentCountryData = null;
}

// global search (explore btn)
globalSearchBtn.addEventListener("click", async () => {
    const countryCode = globalCountry.value;
    const city = citySelect.value;
    const year = globalYear.value;

    if (!countryCode ) {
        Swal.fire({
            icon: 'warning',
            title: 'Incomplete Selection',
            text: 'Please select a country',
        });
        return;
    }

    //(Loading Overlay)
    const loader = document.getElementById("loading-overlay");
    loader.classList.remove("hidden");

    try {
        // (Nager API)
        const holidayResponse = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
        const holidays = await holidayResponse.json();

        // update UI 
        updateCountryDashboardUI();
        updateHolidaysUI(holidays, year);
        updateEventsUI();
        updateWeatherUI();
        updateLongWeekendsUI(countryCode);
         updateSunTimesUI() ; 
    } catch (error) {
        console.error("Error fetching data:", error);
        Swal.fire('Error', 'Failed to fetch some data. Please try again.', 'error');
    }
     finally {
        loader.classList.add("hidden");
    } 
});

  
// update country dashboard
function updateCountryDashboardUI() {
    const country = currentCountryData;
    const infoContainer = document.getElementById("dashboard-country-info");
    // console.log(country);
    infoContainer.innerHTML = `
    <div class="dashboard-country-header">
                <img src="${country.flags.svg}" alt="Egypt" class="dashboard-country-flag">
                <div class="dashboard-country-title">
                  <h3>${country.name.common}</h3>
                  <p class="official-name">${country.name.official}</p>
                  <span class="region"><i class="fa-solid fa-location-dot"></i> ${country.region} • ${country.subregion}</span>
                </div>
              </div>
              
              <div class="dashboard-local-time">
                <div class="local-time-display">
                  <i class="fa-solid fa-clock"></i>
                  <span class="local-time-value" id="country-local-time">08:30:45 AM</span>
                  <span class="local-time-zone">${country.timezones ? country.timezones[0] : "UTC"}</span>
                </div>
              </div>
              <div class="dashboard-country-grid">
                <div class="dashboard-country-detail">
                  <i class="fa-solid fa-building-columns"></i>
                  <span class="label">Capital</span>
                  <span class="value">${country.capital ? country.capital[0] : 'N/A'}</span>
                </div>
                <div class="dashboard-country-detail">
                  <i class="fa-solid fa-users"></i>
                  <span class="label">Population</span>
                  <span class="value">${country.population.toLocaleString()}</span>
                </div>
                <div class="dashboard-country-detail">
                  <i class="fa-solid fa-ruler-combined"></i>
                  <span class="label">Area</span>
                  <span class="value">${country.area.toLocaleString()} km<sup>2</sup></span>
                </div>
                <div class="dashboard-country-detail">
                  <i class="fa-solid fa-globe"></i>
                  <span class="label">Continent</span>
                  <span class="value">${country.continents[0]}</span>
                </div>
                <div class="dashboard-country-detail">
                  <i class="fa-solid fa-phone"></i>
                  <span class="label">Calling Code</span>
                  <span class="value">${country.idd.root}${country.idd.suffixes[0]}</span>
                </div>
                <div class="dashboard-country-detail">
                  <i class="fa-solid fa-car"></i>
                  <span class="label">Driving Side</span>
                  <span class="value">${country.car.side}</span>
                </div>
                <div class="dashboard-country-detail">
                  <i class="fa-solid fa-calendar-week"></i>
                  <span class="label">Week Starts</span>
                  <span class="value">${country.startOfWeek}</span>
                </div>
              </div>
              
              <div class="dashboard-country-extras">
                <div class="dashboard-country-extra">
                  <h4><i class="fa-solid fa-coins"></i> Currency</h4>
                  <div class="extra-tags">
                   ${Object.keys(country.currencies).map(c => `<span class="extra-tag">${country.currencies[c].name}</span>`).join(' ')}
                  </div>
                </div>
                <div class="dashboard-country-extra">
                  <h4><i class="fa-solid fa-language"></i> Languages</h4>
                  <div class="extra-tags">
                  ${Object.values(country.languages).map(l => `<span class="extra-tag">${l}</span>`).join(' ')}
                  </div>
                </div>
                <div class="dashboard-country-extra">
                  <h4><i class="fa-solid fa-map-location-dot"></i> Neighbors</h4>
                  <div class="extra-tags">
                        ${country.borders 
                            ? country.borders.map(b => `
                            <span class="extra-tag clickable-border" onclick="exploreByBorder('${b}')">
                                ${b}
                            </span>`).join(' ') 
                                : '<span class="extra-tag">No Land Borders</span>'
}
                  </div>
                </div>
                <div class="dashboard-country-actions">
                <a href="${country.maps.googleMaps}" rel="noopener" target="_blank" class="btn-map-link">
                  <i class="fa-solid fa-map"></i> View on Google Maps
                </a>
              </div>
              </div>
    
    `;
}

// update Holidays UI
function updateHolidaysUI(holidays, year) {
    const holidaysContent = document.getElementById("holidays-content");
    const badge = document.getElementById("holidays-selection");

    badge.innerHTML = `
     <div class="current-selection-badge">
        <div class="selection-badge">
            <img src="${currentCountryData.flags.png}" alt="${currentCountryData.name.common}" class="selection-flag">
            <span>${currentCountryData.name.common}</span>
            <span class="selection-year">${year}</span>
        </div> 
        </div> `;

    if (holidays.length === 0) {
        holidaysContent.innerHTML = `<p class="empty-state">No holidays found for this year.</p>`;
        return;
    }
    
    holidaysContent.innerHTML = holidays.map(holiday =>
         `
       <div class="holiday-card">
              <div class="holiday-card-header">
                <div class="holiday-date-box">
                <span class="day">${new Date(holiday.date).getDate()}</span>
                <span class="month">${new Date(holiday.date).toLocaleString('default', { month: 'short' })}</span>
                </div>
                <button class="holiday-action-btn"><i class="fa-regular fa-heart"></i></button>
              </div>
              <h3>${holiday.localName}</h3>
              <p class="holiday-name">${holiday.name}</p>
              <div class="holiday-card-footer">
                <span class="holiday-day-badge"><i class="fa-regular fa-calendar"></i> اليوم</span>
                <span class="holiday-type-badge">${holiday.types[0]}</span>
              </div>
            </div>
    `).join('');
}

// update Events UI
async function updateEventsUI() {
    if (!currentCountryData) return;

    const eventsContainer = document.getElementById("events-continar");
    const API_KEY = 'VwECw2OiAzxVzIqnwmKJUG41FbeXJk1y'; 
    const countryCode = currentCountryData.cca2;
    const cityName = currentCountryData.capital ? currentCountryData.capital[0] : "";
     document.querySelector("#events-view .view-header-content p").textContent = `Discover concerts, sports, theatre and more in ${cityName}`;
        document.getElementById("events-selection").innerHTML = `
                <img src="${currentCountryData.flags.svg}" alt="${currentCountryData.name.common}" class="selection-flag">
                <span>${currentCountryData.name.common}</span>
                <span class="selection-city"> ${cityName}</span>
        
        `

    if (eventsContainer) {
        eventsContainer.innerHTML = '<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i> Searching...</div>';
    }

    async function fetchEvents(queryParam) {
        const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&${queryParam}&size=6&sort=date,asc`;
        const res = await fetch(url);
        return await res.json();
    }

    try {
        let data = await fetchEvents(`countryCode=${countryCode}&city=${encodeURIComponent(cityName)}`);

        if (!data._embedded || !data._embedded.events) {
            console.log("No city events, searching entire country...");
            data = await fetchEvents(`countryCode=${countryCode}`);
        }

        if (data._embedded && data._embedded.events) {
            const events = data._embedded.events;
            eventsContainer.innerHTML = events.map(event => {
                const eventImage = event.images.find(img => img.ratio === "16_9")?.url || event.images[0].url;
                const eventCategory = event.classifications?.[0]?.segment?.name || 'General';
                const venueName = event._embedded?.venues?.[0]?.name || 'Venue TBD';
                const eventDate = new Date(event.dates.start.localDate).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric'
                });

                return `
                <div class="event-card animate-fadeIn">
                    <div class="event-card-image">
                        <img src="${eventImage}" alt="${event.name}">
                        <span class="event-card-category">${eventCategory}</span>
                        <button class="event-card-save" ><i class="fa-regular fa-heart"></i></button>
                    </div>
                    <div class="event-card-body">
                        <h3>${event.name}</h3>
                        <div class="event-card-info">
                            <div><i class="fa-regular fa-calendar"></i> ${eventDate}</div>
                            <div><i class="fa-solid fa-location-dot"></i> ${venueName}</div>
                        </div>
                        <div class="event-card-footer">
                            <button class="btn-event"><i class="fa-regular fa-heart"></i> Save</button>
                            <a href="${event.url}" target="_blank" class="btn-buy-ticket">Tickets</a>
                        </div>
                    </div>
                </div>`;
            }).join('');
        } else {
            eventsContainer.innerHTML = `<p class="no-events">Sorry, no events found in ${currentCountryData.name.common} at this time.</p>`;
        }
    } catch (error) {
        console.error("Ticketmaster Error:", error);
    }
}
// update Weather UI
async function updateWeatherUI() {
    if (!currentCountryData || !currentCountryData.latlng) return;

    const [lat, lng] = currentCountryData.latlng;
    const cityName = citySelect.value || currentCountryData.capital[0];
    const countryName = currentCountryData.name.common;
    const flagUrl = currentCountryData.flags.png;

    

    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max&timezone=auto`);
        const data = await response.json();

        document.querySelector("#weather-view .view-header-content p").textContent = `Check 7-day weather forecasts for ${cityName}`;
        document.getElementById("country-info").innerHTML = `
                <img src="${flagUrl}" alt="${countryName}" class="selection-flag">
                <span>${countryName}</span>
                <span class="selection-city"> ${cityName}</span>
        
        `

        const current = data.current;
        const weatherStatus = getWeatherStatus(current.weather_code);
        
        document.querySelector(".weather-location span").textContent = cityName;
        document.querySelector(".weather-time").textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        document.querySelector(".weather-hero-icon").innerHTML = `<i class="fa-solid ${weatherStatus.icon}"></i>`;
        document.querySelector(".temp-value").textContent = Math.round(current.temperature_2m);
        document.querySelector(".weather-condition").textContent = weatherStatus.text;
        document.querySelector(".weather-feels").textContent = `Feels like ${Math.round(current.apparent_temperature)}°C`;
        document.querySelector(".high").innerHTML = `<i class="fa-solid fa-arrow-up"></i> ${Math.round(data.daily.temperature_2m_max[0])}°`;
        document.querySelector(".low").innerHTML = `<i class="fa-solid fa-arrow-down"></i> ${Math.round(data.daily.temperature_2m_min[0])}°`;

        const detailValues = document.querySelectorAll(".detail-value");
        detailValues[0].textContent = `${current.relative_humidity_2m}%`; // Humidity
        detailValues[1].textContent = `${current.wind_speed_10m} km/h`; // Wind
        detailValues[2].textContent = Math.round(data.daily.uv_index_max[0]); // UV
        detailValues[3].textContent = `${data.daily.precipitation_probability_max[0]}%`; // Precip

        const hourlyScroll = document.querySelector(".hourly-scroll");
        hourlyScroll.innerHTML = ""; 
        for (let i = 0; i < 8; i++) {
            const time = new Date(data.hourly.time[i]).toLocaleTimeString([], { hour: 'numeric' });
            const temp = Math.round(data.hourly.temperature_2m[i]);
            const status = getWeatherStatus(data.hourly.weather_code[i]);
            
            hourlyScroll.innerHTML += `
                <div class="hourly-item ${i === 0 ? 'now' : ''}">
                    <span class="hourly-time">${i === 0 ? 'Now' : time}</span>
                    <div class="hourly-icon"><i class="fa-solid ${status.icon}"></i></div>
                    <span class="hourly-temp">${temp}°</span>
                </div>`;
        }

        const forecastList = document.querySelector(".forecast-list");
        forecastList.innerHTML = ""; 
        data.daily.time.forEach((date, i) => {
            const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            const status = getWeatherStatus(data.daily.weather_code[i]);
            const precip = data.daily.precipitation_probability_max[i];

            forecastList.innerHTML += `
                <div class="forecast-day ${i === 0 ? 'today' : ''}">
                    <div class="forecast-day-name">
                        <span class="day-label">${i === 0 ? 'Today' : dayName}</span>
                        <span class="day-date">${dayNum}</span>
                    </div>
                    <div class="forecast-icon"><i class="fa-solid ${status.icon}"></i></div>
                    <div class="forecast-temps">
                        <span class="temp-max">${Math.round(data.daily.temperature_2m_max[i])}°</span>
                        <span class="temp-min">${Math.round(data.daily.temperature_2m_min[i])}°</span>
                    </div>
                    <div class="forecast-precip">
                        ${precip > 0 ? `<i class="fa-solid fa-droplet"></i><span>${precip}%</span>` : ''}
                    </div>
                </div>`;
        });

    } catch (error) {
        console.error("Error updating weather UI:", error);
    }
}

function getWeatherStatus(code) {
    const mapping = {
        0: { text: "Clear Sky", icon: "fa-sun" },
        1: { text: "Mainly Clear", icon: "fa-cloud-sun" },
        2: { text: "Partly Cloudy", icon: "fa-cloud-sun" },
        3: { text: "Overcast", icon: "fa-cloud" },
        45: { text: "Foggy", icon: "fa-smog" },
        51: { text: "Drizzle", icon: "fa-cloud-rain" },
        61: { text: "Rainy", icon: "fa-cloud-showers-heavy" },
        95: { text: "Thunderstorm", icon: "fa-cloud-bolt" }
    };
    return mapping[code] || { text: "Cloudy", icon: "fa-cloud" };
}
// update Long Weekends UI
async function updateLongWeekendsUI(countryCode) {
    const lwContent = document.getElementById("lw-content");
    document.getElementById("weekend-info").innerHTML = `
               <img src="${currentCountryData.flags.png}" alt="${currentCountryData.name.common}" class="selection-flag">
                <span>${currentCountryData.name.common}</span>
                <span class="selection-year">${globalYear.value}</span>
        
        `
    if (!lwContent) return;
    
    lwContent.innerHTML = `<div class="loading">Calculating best travel dates...</div>`;

    try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/2026/${countryCode}`);
        if (!response.ok) throw new Error("Holidays not found");
        const holidays = await response.json();
        
        lwContent.innerHTML = ""; 

        holidays.forEach((holiday, index) => {
            const holidayDate = new Date(holiday.date);
            const dayNum = holidayDate.getDay(); // 0=Sun, 1=Mon, 5=Fri, 6=Sat

            if ([0, 1, 5, 6].includes(dayNum)) {
                
                let daysHtml = "";
                for (let i = -1; i <= 2; i++) {
                    const d = new Date(holidayDate);
                    d.setDate(d.getDate() + i);
                    const isWeekend = [0, 6].includes(d.getDay()); 
                    const isHoliday = d.getTime() === holidayDate.getTime();
                    
                    daysHtml += `
                        <div class="lw-day ${isWeekend ? 'weekend' : ''} ${isHoliday ? 'holiday-highlight' : ''}">
                            <span class="name">${d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span class="num">${d.getDate()}</span>
                        </div>`;
                }

                lwContent.innerHTML += `
                <div class="lw-card">
                    <div class="lw-card-header">
                        <span class="lw-badge"><i class="fa-solid fa-calendar-days"></i> 4 Days Trip</span>
                        <button class="holiday-action-btn" "><i class="fa-regular fa-heart"></i></button>
                    </div>
                    <h3>${holiday.localName}</h3>
                    <div class="lw-dates">
                        <i class="fa-regular fa-calendar"></i> 
                        ${holidayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 2026
                    </div>
                    <div class="lw-info-box success">
                        <i class="fa-solid fa-check-circle"></i> No extra days off needed!
                    </div>
                    <div class="lw-days-visual">
                        ${daysHtml}
                    </div>
                </div>`;
            }
        });

        if (lwContent.innerHTML === "") {
            lwContent.innerHTML = `<p class="no-data">No perfect long weekends found.</p>`;
        }

    } catch (error) {
        console.error("Error:", error);
        lwContent.innerHTML = `<p class="error">Failed to load weekends.</p>`;
    }
}


async function updateSunTimesUI() {
    if (!currentCountryData || !currentCountryData.latlng) return;

    const [lat, lng] = currentCountryData.latlng;
    const cityName = currentCountryData.capital ? currentCountryData.capital[0] : currentCountryData.name.common;
    const countryName = currentCountryData.name.common;
    const flagUrl = currentCountryData.flags.svg || currentCountryData.flags.png;

    try {
        const response = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`);
        const data = await response.json();

        if (data.status === "OK") {
            const res = data.results;

            document.getElementById("current-selection-badge").innerHTML = `
               <img src="${flagUrl}" alt="${countryName}" class="selection-flag">
                <span>${countryName}</span>
                <span class="selection-year">${cityName}</span>
        
        `
            
            document.querySelector(".sun-location h2").innerHTML = `<i class="fa-solid fa-location-dot"></i> ${cityName}`;

            const now = new Date();
            document.querySelector(".sun-date-display .date").innerText = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            document.querySelector(".sun-date-display .day").innerText = now.toLocaleDateString('en-US', { weekday: 'long' });

            const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

            const cards = document.querySelectorAll(".sun-time-card .time");
            cards[0].innerText = formatTime(res.civil_twilight_begin); // Dawn
            cards[1].innerText = formatTime(res.sunrise);              // Sunrise
            cards[2].innerText = formatTime(res.solar_noon);           // Solar Noon
            cards[3].innerText = formatTime(res.sunset);               // Sunset
            cards[4].innerText = formatTime(res.civil_twilight_end);   // Dusk
            
            const hours = Math.floor(res.day_length / 3600);
            const minutes = Math.floor((res.day_length % 3600) / 60);
            const dayLengthStr = `${hours}h ${minutes}m`;
            cards[5].innerText = dayLengthStr; // Day Length

            const dayPercent = ((res.day_length / 86400) * 100).toFixed(1);
            const nightSeconds = 86400 - res.day_length;
            const nightHours = Math.floor(nightSeconds / 3600);
            const nightMinutes = Math.floor((nightSeconds % 3600) / 60);

            document.querySelector(".day-progress-fill").style.width = `${dayPercent}%`;
            const statsValues = document.querySelectorAll(".day-stat .value");
            statsValues[0].innerText = dayLengthStr;
            statsValues[1].innerText = `${dayPercent}%`;
            statsValues[2].innerText = `${nightHours}h ${nightMinutes}m`;
        }
    } catch (error) {
        console.error("Sun Times Update Error:", error);
    }
}




async function exploreByBorder(borderCode) {
    console.log("Exploring:", borderCode);
    try {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${borderCode}`);
        const data = await response.json();
        
        if (data && data[0]) {
            currentCountryData = data[0];

            displayCountry(currentCountryData); 
            updateWeatherUI(); 
            updateSunTimesUI();
            updateEventsUI();
            updateLongWeekendsUI()
        }
    } catch (error) {
        console.error("Border Error:", error);
    }
}

window.exploreByBorder = exploreByBorder;














