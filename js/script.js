// This over-encapsulating function is to ensure that
// everything can only be executed once the DOM is
// fully loaded.
$(document).ready(function () {

    //Card flip animation function
    $("#cardContainer").flip();

    // Delcaring global arrays to manipluate dynamically
    var hoursForGraph = []; //X axis data on the graph
    var temperatureEntriesForGraph = []; //Y axis data on the graph

    //secret api key
    var darkSkyKey = '5d4a94e5b103b567f6a82c921a26e462';

    //api call
    var darkSkyURL = 'https://api.darksky.net/forecast/' + darkSkyKey + '/-27.46794, 153.02809';
    
    //Global variable used to dyanmically change the timezone offset of each API call
    var timezoneOffsetLocal = 0;

    //Global to determine if location time is in AM or PM
    var amPm = "";
    
    // Delcaring global arrays to used as days of the week and months of the year
    var daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var monthsOfYear = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

    // Takes the searchInput element and stores it to be used as a reference
    var takeSearchInput = new google.maps.places.Autocomplete(document.getElementById('searchInput'));

    // When the user searchs for a new location and pick an option from the 
    // the dropdown this function is triggered
    takeSearchInput.addListener('place_changed', function(){
        // Gets the location name from the Google Places API call
        var selectedLocation = takeSearchInput.getPlace().geometry.location;
        // Gets the address from the Google Places API Call
        var selectedLocationName = takeSearchInput.getPlace().formatted_address;
        // Prints the address the localLocationName element
        document.getElementById("localLocationName").innerHTML = selectedLocationName;
        // Calls function to be executed - (Used for searching a new location)
        updateToSearchedLocation(selectedLocation);

    });

    // Function to determine if the hourly time was AM or PM
    function getAmOrPm(hourAmount){
        // If hour is AM
        if(hourAmount >= 0 && hourAmount <= 11){
            amPm = "am"
        }
        // If hour is PM
        else if(hourAmount >= 12 && hourAmount <= 23){
            amPm = "pm";
        }
    }
 
    // Ajax call to retrieve and print local information to the page
    $.ajax({
        url: darkSkyURL,
        type: "get",
        dataType: "jsonp",
        crossDomain: true,
        success: function (data){

            console.log(data);
            // Iterates over the API call to retrieve the next 12 hours in 2 hour segments.
            // Also gets the temperature of those 2 hour segments.
           for(var i = 0; i < 13; i +=2){
                var hoursFromApiConverted = new Date(data.hourly.data[i].time * 1000);
                var getEachHourIteration = hoursFromApiConverted.getHours();
                
                //Calls function
                getAmOrPm(getEachHourIteration);

                // Converts the hour to 12 if hour is midnight and
                // converts hour from 24hour to standard time
                if(getEachHourIteration == 0){
                    getEachHourIteration = "12";
                } 
                else if (getEachHourIteration > 12){
                    getEachHourIteration = getEachHourIteration - 12;
                }

                // Sets hours to format of: "12am"
                var hoursFormatted = getEachHourIteration + amPm;
                // Takes the temperature and converts it to celsius
                var eachHourTempCalc = (data.hourly.data[i].temperature - 32) * 0.556;
                // Rounds temperature to nearest decimal place  
                var eachHourTempRounded = Math.round(eachHourTempCalc);
                // Takes each hour and temperature and pushes them into the global arrays
                temperatureEntriesForGraph.push(eachHourTempRounded);
                hoursForGraph.push(hoursFormatted);

            }
            
            // Initialises the chart and uses the Chart.js API to determine how the chart will look
            var ctx = document.getElementById('myChart');
            var chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hoursForGraph,
                datasets: [{
                    label: 'Next 12 Hours',
                    data: temperatureEntriesForGraph,
                    borderColor: 'rgb(0, 162, 255)'
                }]
            },
             options: {
                responsive: false,
                maintainAspectRatio: true,
                 scales: {
                    yAxes: [{
                        ticks: {
                            min: -10,
                            max: 50,
                            stepSize: 5
                        }
                    }]
                 } 
             }

            });

            // Takes the name of the location and removes any / characters that the API may add
            var placeName = data.timezone.split('/').pop();
            // Formats the name of the location: "Brisbane, Australia" eg.
            var placeNameFormatted = placeName.replace(/_/g, " ");
            
            // Set global to the local offset hour amount
            timezoneOffsetLocal = data.offset; 
            
            // takes the data from the API call gets the desired information
            var dateTime = new Date(data.currently.time * 1000);
            var timeDay = dateTime.getDay();
            var timeDate = dateTime.getDate();
            var timeMonth = dateTime.getMonth() - 1;
            var timeHours = dateTime.getHours();

            // function
            getAmOrPm(timeHours);

                // Converts the hour to 12 if hour is midnight and
                // converts hour from 24hour to standard time
                if(timeHours == 0){
                    timeHours = "12";
                } 
                else if (timeHours > 12){
                    timeHours = timeHours - 12;
                }
            
            // If the minutes returned are less than 10, normally the 0 isn't display
            // but this adds the 0 infront in order to display the standard time format
            var timeMinutes = dateTime.getMinutes();
                if(timeMinutes < 10){
                    timeMinutes = "0" + timeMinutes;
                }
            
            // Creates a string of the information taken from the API call 
            // and display it accordingly
            var currentDateAndTimeFormatted = daysOfWeek[timeDay] + " " + timeDate + " " + monthsOfYear[timeMonth] + " " + timeHours + ':' + timeMinutes + amPm;
                
            // Takes the temperature and converts it to celsius
            var currentTempCalc = (data.currently.temperature - 32) * 0.556;
            // Rounds temperature to nearest decimal place  
            var currentTempRounded = Math.round(currentTempCalc * 10) / 10;

            // Prints the newly formatted information the localLocationName element
            document.getElementById("localLocationName").innerHTML = placeNameFormatted + "," + " " + data.timezone.split('/')[0] ;
            // Prints the newly formatted information the currentLocalInfo element
            document.getElementById("currentLocalInfo").innerHTML = currentDateAndTimeFormatted + '</br>' + "Currently:" + "  " + data.currently.summary + "," + " " + currentTempRounded + '&#186' + "C";

            // Calls function to check which weather icon to display
            currentWeatherIconCheck(data.currently.icon);
    

            // This for loop is to print all of the desired in each card.
            // Each card has the same layout and styling and with 
            // $(".dayCard").eq(i).find(), jquery will go over each card
            // and display the 7 day forecast (including current day)
            for(var i = 0; i < 8; i++){
                
                dateDailyTime = new Date(data.daily.data[i].time * 1000);
                var timeDayDaily = dateDailyTime.getDay();
                var timeDateDaily = dateDailyTime.getDate();
                var timeMonthDaily = dateDailyTime.getMonth() - 1;
                var dateAndTimeDailyFormatted = daysOfWeek[timeDayDaily] + " " + timeDateDaily + " " + monthsOfYear[timeMonthDaily];

                var dailyLowTemp = (data.daily.data[i].temperatureLow - 32) * 0.556;
                var dailyLowtempRounded = Math.round(dailyLowTemp * 10) / 10;
                var dailyHighTemp = (data.daily.data[i].temperatureHigh - 32) * 0.556;
                var dailyHightempRounded = Math.round(dailyHighTemp * 10) / 10;
                var dailyLowAndHighTemp = dailyLowtempRounded + '&#186' + "C" + " " + "&#8659" + " " + "-" + " " + dailyHightempRounded + '&#186' + "C" + " " + "&#8657";

                var dailyAvgTempCalc = (dailyLowtempRounded + dailyHightempRounded) / 2;
                var dailyAvgTemp = dailyAvgTempCalc.toFixed(1) + '&#186' + "C" + " " + "-" + " " + "avg"
                var dailyIcon = dailyWeatherIcon(data.daily.data[i].icon)

                var dailySummary = data.daily.data[i].summary;

                var dailyWindSpeedCalc = (data.daily.data[i].windSpeed * 1.60934);
                var dailyWindSpeed = "&#x1f343" + " " + dailyWindSpeedCalc.toFixed(1)  + "KPH";

                var dailyHumidity = data.daily.data[i].humidity * 100;
                var dailyHumidityFormatted = "Humidity:" + " " +  dailyHumidity.toFixed(0) + "&#37"
         
                $(".dayCard").eq(i).find(".cardDayAndDate").html(dateAndTimeDailyFormatted);
                $(".dayCard").eq(i).find(".cardLowAndHighTemp").html(dailyLowAndHighTemp);
                $(".dayCard").eq(i).find(".cardAvgTemp").html(dailyAvgTemp);
                $(".dayCard").eq(i).find(".cardIcon").css("background-image", 'url("' + dailyIcon + '")');
                $(".dayCard").eq(i).find(".cardSummary").html(dailySummary);
                $(".dayCard").eq(i).find(".cardWindSpeed").html(dailyWindSpeed);
                $(".dayCard").eq(i).find(".cardHumidity").html(dailyHumidityFormatted);
            
            }
        }
    });

    // This function clears the global arrays so that the new information
    // can be pushed into them and performs a new API call of the location
    // the user has entered from the dropdown menu.

    // Also inside this function is the same as the above ajax function but
    // this function works out the local time of the location that was entered
    // see ***Timezone calculation*** below
    function updateToSearchedLocation(searchedLocation){

    hoursForGraph = [];
    temperatureEntriesForGraph = [];

       var newLat = searchedLocation.lat();
       var newLong = searchedLocation.lng();
       var searchLocationURL = 'https://api.darksky.net/forecast/' + darkSkyKey + '/' + newLat + ', ' + newLong;

       $.ajax({
        url: searchLocationURL,
        type: "get",
        dataType: "jsonp",
        crossDomain: true,
        success: function (newData){

            // Clears the chart so the new data can be displayed
            document.getElementById('myChart').html = "";

                var dateTime = new Date(newData.currently.time);

                var currentTempCalc = (newData.currently.temperature - 32) * 0.556;
                var currentTempRounded = Math.round(currentTempCalc * 10) / 10;

                // ***Timezone calculation***
                var newTimezoneOffset = newData.offset;
                            
                if(timezoneOffsetLocal > 0 || timezoneOffsetLocal <= 0){
                    
                    var convertToTimeZoneOfZero = dateTime - (timezoneOffsetLocal * 3600);
                    
                        if(newTimezoneOffset <= 0 || newTimezoneOffset > 0){

                            var convertedTimeFormatted = convertToTimeZoneOfZero + (newTimezoneOffset * 3600);
                            var newLocationTime = new Date(convertedTimeFormatted * 1000);
                            
                            for(var i = 0; i < 13; i +=2){
                                var hoursFromApiConverted = new Date(newData.hourly.data[i].time);
                                var hoursTimeZoneToZero = hoursFromApiConverted - (timezoneOffsetLocal * 3600);
                                var convertedTimeFormatted = hoursTimeZoneToZero + (newTimezoneOffset * 3600);
                                var newHours = new Date(convertedTimeFormatted * 1000);
                                var newHoursConverted = newHours.getHours();

                                getAmOrPm(newHoursConverted);

                                if(newHoursConverted == 0){
                                    newHoursConverted = "12";
                                } 
                                else if (newHoursConverted > 12){
                                    newHoursConverted = newHoursConverted - 12;
                                }
                                var newHoursFormatted = newHoursConverted + amPm;

                                var newEachHourTempCalc = (newData.hourly.data[i].temperature - 32) * 0.556;
                                var newEachHourTempRounded = Math.round(newEachHourTempCalc);

                                temperatureEntriesForGraph.push(newEachHourTempRounded);
                                hoursForGraph.push(newHoursFormatted);
                            }

                            var timeDate = newLocationTime.getDate();
                            var timeMonth = newLocationTime.getMonth() - 1;
                            var timeDay = newLocationTime.getDay();
                            var timeHours = newLocationTime.getHours();
                            var timeMinutes = newLocationTime.getMinutes();

                                if(timeMinutes < 10){
                                    timeMinutes = "0" + timeMinutes;
                                }

                            getAmOrPm(timeHours);
                                if(timeHours == 0){
                                        timeHours = 12;
                                    }
                                else if (timeHours > 12){
                                    timeHours = timeHours - 12;
                                }

                            var currentDateAndTimeFormatted =  daysOfWeek[timeDay] + " " + timeDate + " " + monthsOfYear[timeMonth] + " " + timeHours + ':' + timeMinutes + amPm;
                            document.getElementById("currentLocalInfo").innerHTML = currentDateAndTimeFormatted + '</br>' + "Currently:" + "  " + newData.currently.summary + "," + " " + currentTempRounded + '&#186' + "C";
                        }
                    }
    
                var currentTempCalc = (newData.currently.temperature - 32) * 0.556;
                var currentTempRounded = Math.round(currentTempCalc * 10) / 10;
                        
                currentWeatherIconCheck(newData.currently.icon);

                for(var i = 0; i < 8; i++){
                        
                dateDailyTime = new Date(newData.daily.data[i].time * 1000);
                var timeDayDaily = dateDailyTime.getDay();
                var timeDateDaily = dateDailyTime.getDate();
                var timeMonthDaily = dateDailyTime.getMonth() - 1;
                var dateAndTimeDailyFormatted = daysOfWeek[timeDayDaily] + " " + timeDateDaily + " " + monthsOfYear[timeMonthDaily];

                var dailyLowTemp = (newData.daily.data[i].temperatureLow - 32) * 0.556;
                var dailyLowtempRounded = Math.round(dailyLowTemp * 10) / 10;
                var dailyHighTemp = (newData.daily.data[i].temperatureHigh - 32) * 0.556;
                var dailyHightempRounded = Math.round(dailyHighTemp * 10) / 10;
                var dailyLowAndHighTemp = dailyLowtempRounded + '&#186' + "C" + " " + "&#8659" + " " + "-" + " " + dailyHightempRounded + '&#186' + "C" + " " + "&#8657";

                var dailyAvgTempCalc = (dailyLowtempRounded + dailyHightempRounded) / 2;
                var dailyAvgTemp = dailyAvgTempCalc.toFixed(1) + '&#186' + "C" + " " + "-" + " " + "avg"
                var dailyIcon = dailyWeatherIcon(newData.daily.data[i].icon)

                var dailySummary = newData.daily.data[i].summary;

                var dailyWindSpeedCalc = (newData.daily.data[i].windSpeed * 1.60934);
                var dailyWindSpeed = "&#x1f343" + " " + dailyWindSpeedCalc.toFixed(1)  + "KPH";

                var dailyHumidity = newData.daily.data[i].humidity * 100;
                var dailyHumidityFormatted = "Humidity:" + " " +  dailyHumidity.toFixed(0) + "&#37"
        
                $(".dayCard").eq(i).find(".cardDayAndDate").html(dateAndTimeDailyFormatted);
                $(".dayCard").eq(i).find(".cardLowAndHighTemp").html(dailyLowAndHighTemp);
                $(".dayCard").eq(i).find(".cardAvgTemp").html(dailyAvgTemp);
                $(".dayCard").eq(i).find(".cardIcon").css("background-image", 'url("' + dailyIcon + '")');
                $(".dayCard").eq(i).find(".cardSummary").html(dailySummary);
                $(".dayCard").eq(i).find(".cardWindSpeed").html(dailyWindSpeed);
                $(".dayCard").eq(i).find(".cardHumidity").html(dailyHumidityFormatted);
                         
                }

                // Initialises the chart to be displyed with the new data
                var ctx = document.getElementById('myChart');
                var chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: hoursForGraph,
                        datasets: [{
                            label: 'Next 12 Hours',
                            data: temperatureEntriesForGraph,
                            borderColor: 'rgb(0, 162, 255)'
                        }]
                    },
                    options: {
                        scales: {
                            yAxes: [{
                                ticks: {
                                    min: -10,
                                    max: 50,
                                    stepSize: 10
                                }
                            }]
                        } 
                    }

                });

            }
        });

    }
    
    // Function to determine which icon string is to be added to the URL
    function dailyWeatherIcon(dailyIconRetrieve){

        var dailyIconURL = "";

        switch(dailyIconRetrieve){

            case "clear-day":
            dailyIconURL = "./img/clearIcon.png";
            break;

            case "clear-night":
            dailyIconURL = "./img/clearIcon.png";
            break;

            case "rain":
            dailyIconURL = "./img/rainIcon.png";
            break;

            case "snow":
            dailyIconURL = "./img/snowIcon.png";
            break;

            case "sleet":
            dailyIconURL = "./img/snowIcon.png";
            break;

            case "wind":
            dailyIconURL = "./img/windIcon.png";
            break;

            case "fog":
            dailyIconURL = "./img/fogIcon.png";
            break;

            case "cloudy":
            dailyIconURL = "./img/cloudyIcon.png";
            break;

            case "partly-cloudy-day":
            dailyIconURL = "./img/partlyCloudyIcon.png";
            break;

            case "partly-cloudy-night":
            dailyIconURL = "./img/partlyCloudyIcon.png";
            break;

            case "thunderstorm":
            dailyIconURL = "./img/stormIcon.png";
            break;

            case "tornado":
            dailyIconURL = "./img/tornadoIcon.png";
            break;

        }

        return dailyIconURL;  
    }

    // Function to determine which icon ios to be displayed in the currentWeatherIcon element
    function currentWeatherIconCheck(dataRetreive){

        switch(dataRetreive){
                case "clear-day":
                document.getElementById('currentWeatherIcon').style.background = 'url(./img/clearIcon.png) no-repeat center';
                document.getElementById('currentWeatherIcon').style.backgroundSize = 'cover';      
                break;

                case "clear-night":
                document.getElementById('currentWeatherIcon').style.background = 'url(./img/clearIcon.png) no-repeat center';
                document.getElementById('currentWeatherIcon').style.backgroundSize = 'cover';
                break;

                case "rain":
                document.getElementById('currentWeatherIcon').style.background = 'url(./img/rainIcon.png) no-repeat center';
                document.getElementById('currentWeatherIcon').style.backgroundSize = 'cover';
                break;

                case "snow":
                document.getElementById('currentWeatherIcon').style.background = 'url(./img/snowIcon.png) no-repeat center';
                document.getElementById('currentWeatherIcon').style.backgroundSize = 'cover';
                break;

                case "sleet":
                document.getElementById('currentWeatherIcon').style.background = 'url(./img/snowIcon.png) no-repeat center';
                document.getElementById('currentWeatherIcon').style.backgroundSize = 'cover';
                
                break;

                case "wind":
                document.getElementById('currentWeatherIcon').style.background = 'url(./img/windIcon.png) no-repeat center';
                document.getElementById('currentWeatherIcon').style.backgroundSize = 'cover';
                
                break;

                case "fog":
                document.getElementById('currentWeatherIcon').style.background = 'url(./img/fogIcon.png) no-repeat center';
                document.getElementById('currentWeatherIcon').style.backgroundSize = 'cover';
                
                break;

                case "cloudy":
                document.getElementById('currentWeatherIcon').style.background = 'url(./img/cloudyIcon.png) no-repeat center';
                document.getElementById('currentWeatherIcon').style.backgroundSize = 'cover';
                
                break;

                case "partly-cloudy-day":
                document.getElementById('currentWeatherIcon').style.background = 'url(./img/partlyCloudyIcon.png) no-repeat center';
                document.getElementById('currentWeatherIcon').style.backgroundSize = 'cover';
                break;

                case "partly-cloudy-night":
                document.getElementById('currentWeatherIcon').style.background = 'url(./img/partlyCloudyIcon.png) no-repeat center';
                document.getElementById('currentWeatherIcon').style.backgroundSize = 'cover';
                break;

                case "thunderstorm":
                document.getElementById('currentWeatherIcon').style.background = 'url(./img/stormIcon.png) no-repeat center';
                document.getElementById('currentWeatherIcon').style.backgroundSize = 'cover';
                break;
                
                case "tornado":
                document.getElementById('currentWeatherIcon').style.background = 'url(./img/tornadoIcon.png) no-repeat center';
                document.getElementById('currentWeatherIcon').style.backgroundSize = 'cover';
                break;
            }
    }

});
