# Holiday Explorer

Holiday Explorer is a web application powered by the Holiday API that allows users to explore public holidays from different countries. Users can search holidays by country and year, view upcoming holidays, and access real-time holiday information through authenticated API requests. The project was developed to demonstrate API integration, data retrieval, responsive web design, error handling, and collaborative development using Git and GitHub. Built with HTML, CSS, and JavaScript, Holiday Explorer provides a simple, interactive, and user-friendly experience for discovering holiday information worldwide.

## Features

* Search public holidays by country and year
* View upcoming holidays
* Real-time holiday data retrieval using Holiday API
* API key authentication
* Responsive and user-friendly interface
* Error handling for invalid requests and API failures
* Mobile-friendly design

## Technologies Used

* HTML5
* CSS3
* JavaScript (ES6)
* Holiday API
* Git
* GitHub

## Project Structure

| Branch                      | Module            |
| --------------------------- | ----------------- |
| `feature/homepage`          | Homepage          |
| `feature/search`            | Holiday Search    |
| `feature/upcoming-holidays` | Upcoming Holidays |

## Contributors

| Name                         | Branch                      | Responsibility                     |
| ---------------------------- | --------------------------- | ---------------------------------- |
| **Evina R. Suanes**          | `feature/search`            | Holiday Search Page Development    |
| **Ronian U. Hayag**          | `feature/homepage`          | Homepage Development               |
| **Janelle Mae V. de Torres** | `feature/upcoming-holidays` | Upcoming Holidays Page Development |

## API Integration

### Holiday API

Holiday Explorer uses the Holiday API to retrieve public holiday information from various countries through authenticated API requests.

Example Request:

```http
GET https://holidayapi.com/v1/holidays?key=YOUR_API_KEY&country=PH&year=2025
```

## Learning Objectives

This project demonstrates:

* REST API integration
* HTTP GET requests
* API key authentication
* JSON data processing
* Responsive web design
* Error handling and user feedback
* Collaborative development using Git and GitHub

---

Developed as an API Integration Project using Holiday API.

### LINKS OF API USED

Upcoming Holidays - https://calendarific.com/
Holidays Explorer - https://holidayapi.com/
