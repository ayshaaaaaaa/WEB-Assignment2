const weatherVideos = {
    Clear: 'https://videos.pexels.com/video-files/1309214/1309214-hd_1920_1080_30fps.mp4',
    Clouds: 'https://videos.pexels.com/video-files/1542008/1542008-hd_1920_1080_30fps.mp4',
    Rain: 'https://videos.pexels.com/video-files/856186/856186-hd_1920_1080_30fps.mp4',
    Snow: 'https://videos.pexels.com/video-files/855614/855614-uhd_2560_1440_25fps.mp4',
    Thunderstorm: 'https://videos.pexels.com/video-files/16352168/16352168-uhd_2560_1440_30fps.mp4',
    Mist: 'https://videos.pexels.com/video-files/2534297/2534297-uhd_2560_1440_30fps.mp4',
    Smoke: 'https://videos.pexels.com/video-files/27580900/12174404_2560_1440_30fps.mp4',

};

const videoElement = document.querySelector('.vid');
videoElement.addEventListener('ended', () => {
    videoElement.currentTime = 0; // Reset to the start
    videoElement.play(); // Play again
});

window.globalCity = 'Moscow';
document.addEventListener('DOMContentLoaded', function() {
    const storedCity = localStorage.getItem('globalCity');
    if (storedCity) {
        window.globalCity = storedCity;
    }
    getWeatherData(window.globalCity); // Load default city weather data on page load
});

document.querySelector('.search-btn').addEventListener('click', function() {
    var city = document.getElementById('citySearch').value;
    window.globalCity = city; // Update the global city variable
    localStorage.setItem('globalCity', city); //
    getWeatherData(city); // Call function to get weather data for the city
});


// Global variable to hold the chart instanceS
let verticalBarChart, doughnutChart, lineChart;
// Function to fetch weather data for the current weather and 5-day forecast
function getWeatherData(city) {
    const apiKey = '27a191b9cda6f5e5f8e8804915149e15'; // Your OpenWeather API key
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    // Fetch current weather data
    fetch(weatherUrl)
        .then(response => response.json())
        .then(data => {
            if (data.cod === 200) {
                updateWeatherUI(data);
                return fetch(forecastUrl); // Fetch forecast data after current weather is retrieved
            } else {
                alert('City not found! Please try again.');
                throw new Error('City not found');
            }
        })
        .then(response => response.json())
        .then(forecastData => {
            if (forecastData.cod === "200") {
                updateForecastUI(forecastData);
                updateCharts(forecastData); // Add chart update here
            }
        })
        .catch(error => console.error('Error fetching the weather data:', error));
}

document.getElementById('vertical-bar').style.color = 'white';
document.getElementById('doughnut-chart').style.color = 'white';
document.getElementById('line-chart').style.color = 'white';

// Function to update the UI with the current weather data
function updateWeatherUI(data) {
    document.querySelector('.temp-value').textContent = `${Math.round(data.main.temp)}°`; // Current temperature
    document.querySelector('.condition').textContent = data.weather[0].main; // Weather condition
    document.querySelector('.temp-desc img').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`; // Weather icon
    document.querySelector('.city').textContent = data.name; // City name

    const weatherCondition = data.weather[0].main; // Get the current weather condition
    const videoUrl = weatherVideos[weatherCondition] || 'url(/default-video.mp4)'; // Fallback to default video if condition is not in the list
    console.log("In func: url " + videoUrl);
    const videoElement = document.querySelector('.vid');
    const sourceElement = videoElement.querySelector('source');
    sourceElement.src = videoUrl;
    videoElement.load();
    // Update additional air conditions (like real feel, wind, clouds, humidity)
    document.querySelector('.airstats:nth-child(1) span').textContent = `${Math.round(data.main.feels_like)}°`; // Real feel
    document.querySelector('.airstats:nth-child(2) span').textContent = `${data.wind.speed} km/h`; // Wind speed
    document.querySelector('.airstats:nth-child(3) span').textContent = `${data.clouds.all}%`; // Cloud coverage (approximate rain chance)
    document.querySelector('.airstats:nth-child(4) span').textContent = `${data.main.humidity}%`; // Humidity
}

// Function to update the UI with the 5-day forecast data
function updateForecastUI(data) {
    const hourlyForecastContainer = document.querySelector('.forecast-today');
    hourlyForecastContainer.innerHTML = ''; // Clear existing content

    const dailyForecastContainer = document.querySelector('.weekly-forecast');
    dailyForecastContainer.innerHTML = '<p class="Weeklypara">Weekly Forecast</p>'; // Clear existing daily forecast

    let i = 6; // Starting time for the hourly forecast

    // Filter for noon data for daily forecast display
    const hourlyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));
    hourlyData.forEach(item => {
        const hourlyItem = document.createElement('div');
        hourlyItem.classList.add('hourly-item');
        hourlyItem.innerHTML = `
            <p>${i}:00</p>
            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${item.weather[0].description}" />
            <p>${Math.round(item.main.temp)}°</p>
        `;
        hourlyForecastContainer.appendChild(hourlyItem);
        i += 3;
    });

    // Group data by day and generate daily forecast
    const dailyData = data.list.reduce((acc, item) => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!acc[date]) {
            acc[date] = {
                tempMax: Math.round(item.main.temp_max),
                tempMin: Math.round(item.main.temp_min),
                weather: item.weather[0].description,
                icon: item.weather[0].icon,
            };
        } else {
            acc[date].tempMax = Math.max(acc[date].tempMax, Math.round(item.main.temp_max));
            acc[date].tempMin = Math.min(acc[date].tempMin, Math.round(item.main.temp_min));
        }
        return acc;
    }, {});

    // Populate the weekly forecast in the UI
    Object.keys(dailyData).forEach(date => {
        const dailyItem = document.createElement('div');
        dailyItem.classList.add('forecast-day');
        dailyItem.innerHTML = `
            <p class="one">${new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
            <img src="https://openweathermap.org/img/wn/${dailyData[date].icon}@2x.png" alt="${dailyData[date].weather}" />
            <p class="two">${dailyData[date].weather}</p>
            <p class="temperature">${dailyData[date].tempMax}/${dailyData[date].tempMin}°C</p>
        `;
        dailyForecastContainer.appendChild(dailyItem);
    });
}

// Function to update the temperature trend chart using Chart.js
function updateTemperatureChart(data) {
    const forecastTemps = data.list.filter(item => item.dt_txt.includes("12:00:00")).map(item => ({
        date: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        temp: Math.round(item.main.temp),
    }));

    const labels = forecastTemps.map(item => item.date); // X-axis labels (dates)
    const temps = forecastTemps.map(item => item.temp); // Y-axis data (temperatures)

    const ctx = document.getElementById('tempChart').getContext('2d');

    // Destroy the previous chart instance if it exists
    if (tempChart) {
        tempChart.destroy();
    }

    // Create new line chart
    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temps,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false,
                    suggestedMin: Math.min(...temps) - 5, // Adjust to better fit data
                    suggestedMax: Math.max(...temps) + 5
                }
            }
        }
    });
}

// Event listener for the dashboard click, changing the background color
document.getElementById('dash').addEventListener('click', function() {
    this.style.backgroundColor = '#34495e'; // Correctly apply background color change
});

function updateCharts(data) {
    const forecastTemps = data.list.filter(item => item.dt_txt.includes("12:00:00")).map(item => ({
        date: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        temp: Math.round(item.main.temp),
        weather: item.weather[0].main
    }));

    // Data for vertical bar and line charts (next 5 days' temperature at noon)
    const labels = forecastTemps.map(item => item.date);
    const temps = forecastTemps.map(item => item.temp);

    // Data for doughnut chart (percentage of different weather conditions over 5 days)
    const weatherConditions = forecastTemps.reduce((acc, item) => {
        acc[item.weather] = (acc[item.weather] || 0) + 1;
        return acc;
    }, {});

    const weatherLabels = Object.keys(weatherConditions);
    const weatherData = Object.values(weatherConditions);

    // Update Vertical Bar Chart
    const ctxBar = document.getElementById('verticalBarChart').getContext('2d');
    if (verticalBarChart) {
        verticalBarChart.destroy();
    }
    verticalBarChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temps,
                backgroundColor: 'rgba(41, 128, 185, 0.4)', // Darker color
                borderColor: 'rgba(44, 62, 80, 1)',
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        color: 'white' // Font color white
                    }
                }
            },
            animation: {
                delay: 500 // Delay animation for the bar chart
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'white' // White font for y-axis labels
                    }
                },
                x: {
                    ticks: {
                        color: 'white' // White font for x-axis labels
                    }
                }
            }
        }
    });

    // Update Doughnut Chart
    const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
    if (doughnutChart) {
        doughnutChart.destroy();
    }
    doughnutChart = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: weatherLabels,
            datasets: [{
                data: weatherData,
                backgroundColor: [
                    'rgba(52, 152, 219, 0.8)', // Darker color for clear weather
                    'rgba(39, 174, 96, 0.8)', // Darker color for rain
                    'rgba(241, 196, 15, 0.8)', // Darker color for sunny
                    'rgba(231, 76, 60, 0.8)', // Darker color for other conditions
                ],
                borderColor: [
                    'rgba(52, 152, 219, 1)',
                    'rgba(39, 174, 96, 1)',
                    'rgba(241, 196, 15, 1)',
                    'rgba(231, 76, 60, 1)',
                ],
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'right', // Position the legend to the right of the chart
                    labels: {
                        color: 'white' // Font color white
                    }
                }
            },
            animation: {
                delay: 500 // Delay animation for the doughnut chart
            }
        }
    });

    // Update Line Chart
    const ctxLine = document.getElementById('lineChart').getContext('2d');
    if (lineChart) {
        lineChart.destroy();
    }
    lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temps,
                backgroundColor: 'rgba(41, 128, 185, 0.4)', // Darker color
                borderColor: 'rgba(41, 128, 185, 1)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        color: 'white' // Font color white
                    }
                }
            },
            animation: {
                onComplete: () => {
                    const chartInstance = lineChart;
                    chartInstance.canvas.style.animation = 'drop 1s ease-out';
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    suggestedMin: Math.min(...temps) - 5,
                    suggestedMax: Math.max(...temps) + 5,
                    ticks: {
                        color: 'white' // White font for y-axis labels
                    }
                },
                x: {
                    ticks: {
                        color: 'white' // White font for x-axis labels
                    }
                }
            }
        }
    });

    // Set white font for chart headings using JavaScript
    document.getElementById('verticalBarChartTitle').style.color = 'white';
    document.getElementById('doughnutChartTitle').style.color = 'white';
    document.getElementById('lineChartTitle').style.color = 'white';
}