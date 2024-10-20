var selectedCity = 'Moscow';
//var selectedCity = localStorage.getItem(globalCity);
console.log('selected city: ' + selectedCity)
document.addEventListener('DOMContentLoaded', function() {
    //selectedCity = window.globalCity;
    // fetchWeatherDataByCity(55.7558, 37.6173, selectedCity); // Default city (Moscow) with lat & long
    fetchCoordinates(selectedCity);
});

document.querySelector('.search-btn').addEventListener('click', function() {
    const cityInput = document.getElementById('citySearch').value;
    selectedCity = cityInput;
    fetchCoordinates(cityInput); // Get coordinates for the searched city

    window.globalCity = selectedCity;
    window.dispatchEvent(new CustomEvent('cityChanged', { detail: selectedCity }));

});


window.addEventListener('cityChanged', function(event) {
    const newCity = event.detail;
    selectedCity = newCity;
    document.getElementById('citySearch').value = newCity; // Update the search input
    fetchCoordinates(newCity);
});

let weatherForecastData = []; // Stores weather data
let currentTablePage = 1;
const tableRowsPerPage = 10;

// Function to fetch city coordinates using OpenWeather's Geocoding API
function fetchCoordinates(cityName) {
    const geoApiKey = '27a191b9cda6f5e5f8e8804915149e15'; // Replace with your API key
    const geoApiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${geoApiKey}`;

    fetch(geoApiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const { lat, lon } = data[0]; // Get latitude and longitude from response
                fetchWeatherDataByCity(lat, lon, cityName); // Fetch weather data using the coordinates
            } else {
                alert('City not found! Please try again.');
            }
        })
        .catch(error => console.error('Error fetching city coordinates:', error));
}

function fetchWeatherDataByCity(latitude, longitude, cityName) {
    const weatherApiKey = '27a191b9cda6f5e5f8e8804915149e15'; // Replace with your OpenWeather API key
    const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${weatherApiKey}&units=metric`;

    // Show loading spinner
    document.getElementById('loadingSpinner').style.display = 'block';

    fetch(forecastApiUrl)
        .then(response => response.json())
        .then(data => {
            document.getElementById('loadingSpinner').style.display = 'none';

            if (data.cod === "200") {
                weatherForecastData = processWeatherForecastData(data);
                displayWeatherForecastTable(cityName); // Pass city name to display in the table
            } else {
                alert('Weather data not found! Please try again.');
            }
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            document.getElementById('loadingSpinner').style.display = 'none'; // Hide spinner if error
        });
}

function processWeatherForecastData(data) {
    return data.list.map(item => {
        return {
            date: new Date(item.dt * 1000).toLocaleDateString(),
            temperature: Math.round(item.main.temp),
            weatherCondition: item.weather[0].main,
            rainfall: item.rain ? item.rain["3h"] : 0 // Rain volume (3 hours)
        };
    });
}

// Function to display weather data in table format
function displayWeatherForecastTable(cityName) {
    const tableContainer = document.querySelector('.Tablediv');
    let paginatedData = paginateData(weatherForecastData, currentTablePage, tableRowsPerPage);

    let tableHTML = `
        <h3>5-Day Weather Forecast for ${selectedCity}</h3>

        <button onclick="showDayWithHighestTemperature()">Show Highest Temp</button>

        <table class="weather-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Temperature 
                    <br>
                        <button onclick="sortTableByTemperature('asc')">↑</button>
                        <button onclick="sortTableByTemperature('desc')">↓</button>
                    </th>
                    <th>Weather</th>
                    <th>Rain 
                     <br>
                        <button id="showNoRainBtn" onclick="showNoRainDays()">Show No Rain</button>
                        <button id="showRainyDaysBtn" onclick="showRainyDays()">Show Rainy Days</button>
                    </th>
                </tr>
            </thead>
            <tbody>
    `;

    paginatedData.forEach(item => {
        tableHTML += `
            <tr>
                <td>${item.date}</td>
                <td>${item.temperature}°C</td>
                <td>${item.weatherCondition}</td>
                <td>${item.rainfall ? item.rainfall + 'mm' : 'No Rain'}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    tableHTML += getPaginationButtons(weatherForecastData.length);

    tableContainer.innerHTML = tableHTML;

    // Enable buttons for rain filtering
    document.getElementById('showNoRainBtn').disabled = false;
    document.getElementById('showRainyDaysBtn').disabled = false;
}

// Filter and show days with no rain
function showNoRainDays() {
    const noRainData = weatherForecastData.filter(item => item.rainfall === 0);
    currentTablePage = 1; // Reset current page
    displayFilteredWeatherTable(noRainData);
}

// Filter and show rainy days
function showRainyDays() {
    const rainyDaysData = weatherForecastData.filter(item => item.rainfall > 0);
    currentTablePage = 1; // Reset current page

    displayFilteredWeatherTable(rainyDaysData);
}

// Function to display filtered weather data
function displayFilteredWeatherTable(filteredData) {
    const tableContainer = document.querySelector('.Tablediv');
    let paginatedData = paginateData(filteredData, currentTablePage, tableRowsPerPage);

    let tableHTML = `
        <h3>5-Day Forecast in ${selectedCity}</h3>
        <button onclick="displayWeatherForecastTable()">Back</button>

        <table class="weather-table">
            <thead>
                <tr>
                   <th>Date</th>
                    <th>Temperature 
                    <br>
                        <button onclick="sortTableByTemperature('asc')">↑</button>
                        <button onclick="sortTableByTemperature('desc')">↓</button>
                    </th>
                    <th>Weather</th>
                    <th>Rain 
                     <br>
                        <button id="showNoRainBtn" onclick="showNoRainDays()">Show No Rain</button>
                        <button id="showRainyDaysBtn" onclick="showRainyDays()">Show Rainy Days</button>
                    </th>
                </tr>
            </thead>
            <tbody>
    `;
    document.getElementById('showRainyDaysBtn').classList.add('disabled-btn');
    document.getElementById('showNoRainBtn').classList.remove('disabled-btn');

    // Optionally disable buttons to prevent further clicking
    document.getElementById('showRainyDaysBtn').disabled = true;
    document.getElementById('showNoRainBtn').disabled = false;

    paginatedData.forEach(item => {
        tableHTML += `
            <tr>
                <td>${item.date}</td>
                <td>${item.temperature}°C</td>
                <td>${item.weatherCondition}</td>
                <td>${item.rainfall ? item.rainfall + 'mm' : 'No Rain'}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    tableHTML += getPaginationButtons(filteredData.length);

    tableContainer.innerHTML = tableHTML;

    // Disable buttons for rain filtering
    document.getElementById('showNoRainBtn').disabled = true;
    document.getElementById('showRainyDaysBtn').disabled = true;
}

// Paginate the data
function paginateData(data, page, rows) {
    const startIndex = (page - 1) * rows;
    const endIndex = startIndex + rows;
    return data.slice(startIndex, endIndex);
}

// Sort table by temperature
function sortTableByTemperature(order) {
    weatherForecastData.sort((a, b) => {
        return order === 'asc' ? a.temperature - b.temperature : b.temperature - a.temperature;
    });
    displayWeatherForecastTable(); // Redisplay the table after sorting
}

// Pagination controls
function getPaginationButtons(totalItems) {
    const totalPages = Math.ceil(totalItems / tableRowsPerPage);
    if (totalPages <= 1) return ''; // No need for pagination

    let paginationHTML = `<div class="pagination">`;

    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `<button onclick="changeTablePage(${i})" class="${currentTablePage === i ? 'active' : ''}">${i}</button>`;
    }

    paginationHTML += `</div>`;
    return paginationHTML;
}

// Change table page
function changeTablePage(pageNumber) {
    currentTablePage = pageNumber;
    displayWeatherForecastTable();
}

// Show the day with the highest temperature
function showDayWithHighestTemperature() {
    const hottestDay = weatherForecastData.reduce((previousDay, currentDay) => {
        return (previousDay.temperature > currentDay.temperature) ? previousDay : currentDay;
    });

    const tableContainer = document.querySelector('.Tablediv');
    tableContainer.innerHTML = `
        <h3>Day with the Highest temp in ${selectedCity}</h3>
        <button onclick="displayWeatherForecastTable()">Back</button>

        <table class="weather-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Temperature 
                    <br>
                        <button onclick="sortTableByTemperature('asc')">↑</button>
                        <button onclick="sortTableByTemperature('desc')">↓</button>
                    </th>
                    <th>Weather</th>
                    <th>Rain</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${hottestDay.date}</td>
                    <td>${hottestDay.temperature}°C</td>
                    <td>${hottestDay.weatherCondition}</td>
                    <td>${hottestDay.rainfall ? hottestDay.rainfall + 'mm' : 'No Rain'}</td>
                </tr>
            </tbody>
        </table>
    `;
}
//AIzaSyDNvwyqN033zCcKWjUd0vSp7tUgG75wcrc

// Chatbox
document.addEventListener('DOMContentLoaded', function() {
    const chatboxContainer = document.getElementById('chatbox');
    const sendMessageButton = document.getElementById('sendButton');
    const userMessageInput = document.getElementById('userInput');

    const DEBUG = true;
    const GEMINI_API_KEY = 'AIzaSyDNvwyqN033zCcKWjUd0vSp7tUgG75wcrc'; // Replace with actual Gemini API Key
    const OPENWEATHER_API_KEY = '27a191b9cda6f5e5f8e8804915149e15'; // Replace with your OpenWeather API Key

    // Initialize Gemini
    let genAI;
    sendMessageButton.addEventListener('click', async() => {
        if (!window.GoogleGenerativeAI) {
            const { GoogleGenerativeAI } = await
            import ('https://esm.run/@google/generative-ai');
            window.GoogleGenerativeAI = GoogleGenerativeAI;
        }
        if (!genAI) {
            try {
                genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                if (DEBUG) console.log('Gemini initialized successfully');
            } catch (error) {
                logError(error, 'Gemini initialization');
            }
        }

        const userMessage = userMessageInput.value.trim();
        if (userMessage) {
            addUserMessageToChatbox(userMessage);
            userMessageInput.value = ''; // Clear input field
            displayTypingIndicator();
            await processUserMessage(userMessage);
        }
    });

    function addUserMessageToChatbox(message) {
        const userMessageDiv = document.createElement('div');
        userMessageDiv.classList.add('chat-message', 'user-message');
        userMessageDiv.innerText = message;
        chatboxContainer.appendChild(userMessageDiv);
        chatboxContainer.scrollTop = chatboxContainer.scrollHeight;
    }

    function displayTypingIndicator() {
        const typingIndicatorDiv = document.createElement('div');
        typingIndicatorDiv.classList.add('chat-message', 'ai-message', 'typing');
        typingIndicatorDiv.innerText = 'Gemini is typing...';
        typingIndicatorDiv.setAttribute('id', 'typingIndicator');
        chatboxContainer.appendChild(typingIndicatorDiv);
        chatboxContainer.scrollTop = chatboxContainer.scrollHeight;
    }

    function removeTypingIndicator() {
        const typingIndicatorDiv = document.getElementById('typingIndicator');
        if (typingIndicatorDiv) {
            typingIndicatorDiv.remove();
        }
    }

    async function processUserMessage(userMessage) {
        try {
            const intent = await analyzeIntent(userMessage);

            if (DEBUG) console.log('Intent analysis:', intent);

            let response;
            if (intent.isWeatherQuery && intent.confidence > 0.7) {
                const city = intent.city || selectedCity; // Use default city if no city found
                try {
                    response = await fetchWeather(city);
                } catch (error) {
                    response = "Sorry, I couldn't fetch the weather data. Please try again.";
                }
            } else {
                response = "I can only answer weather-related questions. Please ask me about the weather!";
            }

            removeTypingIndicator();
            addAiMessageToChatbox(response);
        } catch (error) {
            logError(error, 'Chat handling');
            removeTypingIndicator();
            addAiMessageToChatbox('Sorry, I encountered an error. Please try again.');
        }
    }

    async function analyzeIntent(userMessage) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `
            Analyze if this is a weather-related query and extract any city mentioned.
            Return JSON only in this format:
            {
                "isWeatherQuery": boolean,
                "city": string or null,
                "confidence": number between 0 and 1
            }

            User query: "${userMessage}"`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const parsedResponse = JSON.parse(response.text());

            if (DEBUG) console.log('Gemini response:', parsedResponse);
            return parsedResponse;
        } catch (error) {
            logError(error, 'Gemini analysis');
            return {
                isWeatherQuery: userMessage.toLowerCase().includes('weather'),
                city: extractCity(userMessage),
                confidence: 1.0
            };
        }
    }

    async function fetchWeather(city) {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Weather data not found');

            const data = await response.json();
            if (DEBUG) console.log('Weather data:', data);

            return `The weather in ${city} is currently ${data.weather[0].description} with a temperature of ${Math.round(data.main.temp)}°C.`;
        } catch (error) {
            logError(error, 'Weather API');
            throw error;
        }
    }

    function addAiMessageToChatbox(message) {
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.classList.add('chat-message', 'ai-message');
        aiMessageDiv.innerText = message;
        chatboxContainer.appendChild(aiMessageDiv);
        chatboxContainer.scrollTop = chatboxContainer.scrollHeight;
    }

    function logError(error, context) {
        if (DEBUG) {
            console.error(`Error in ${context}:`, error);
            //  addAiMessageToChatbox(`Bot: Debug - Error in ${context}: ${error.message}`);
        }
    }

    function extractCity(userMessage) {
        const commonWords = new Set(['weather', 'in', 'the', 'what', 'is', 'tell', 'me', 'about', 'how', 'today', '?', 'today?']);
        const words = userMessage.split(' ');

        for (let word of words) {
            if (!commonWords.has(word.toLowerCase()) && word.length > 2) {
                return word.charAt(0).toUpperCase() + word.slice(1);
            }
        }
        return null;
    }
});